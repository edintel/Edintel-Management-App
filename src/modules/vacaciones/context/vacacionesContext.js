import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useMsal } from '@azure/msal-react';
import VacacionesService from '../components/Service/VacacionesService';
import { vacacionesConfig } from '../config/vacaciones.config';

const VacacionesContext = createContext(null);

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_VACACIONES: 'SET_VACACIONES',
  SET_DEPARTMENTS: 'SET_DEPARTMENTS',
  SET_ROLES: 'SET_ROLES',
  SET_USER_ROLE: 'SET_USER_ROLE',
  SET_INITIALIZED: 'SET_INITIALIZED',
  UPDATE_REQUEST: 'UPDATE_REQUEST',
  ADD_REQUEST: 'ADD_REQUEST',
};

const initialState = {
  vacacionesRequests: [],
  departments: [],
  roles: [],
  userDepartmentRole: null,
  loading: true,
  error: null,
  initialized: false,
};

function vacacionesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_VACACIONES:
      return { ...state, vacacionesRequests: action.payload };
    case ACTIONS.SET_DEPARTMENTS:
      return { ...state, departments: action.payload };
    case ACTIONS.SET_ROLES:
      return { ...state, roles: action.payload };
    case ACTIONS.SET_USER_ROLE:
      return { ...state, userDepartmentRole: action.payload };
    case ACTIONS.SET_INITIALIZED:
      return { ...state, initialized: action.payload };
    case ACTIONS.UPDATE_REQUEST:
      return {
        ...state,
        vacacionesRequests: state.vacacionesRequests.map(req =>
          req.id === action.payload.id ? { ...req, ...action.payload } : req
        ),
      };
    case ACTIONS.ADD_REQUEST:
      return {
        ...state,
        vacacionesRequests: [action.payload, ...state.vacacionesRequests],
      };
    default:
      return state;
  }
}

export function VacacionesProvider({ children }) {
  const [state, dispatch] = useReducer(vacacionesReducer, initialState);
  const { instance, accounts } = useMsal();
  const [service, setService] = React.useState(null);
  const hasLoadedData = useRef(false);
  const requestsRef = useRef([]);

  useEffect(() => {
    requestsRef.current = state.vacacionesRequests;
  }, [state.vacacionesRequests]);

  const loadVacacionesData = useCallback(async (serviceInstance = null) => {
    const activeService = serviceInstance || service;
    if (!activeService || !accounts[0]?.username) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const [requestsData, departmentsData, rolesData] = await Promise.all([
        activeService.getVacacionesRequests(),
        activeService.getDepartments(),
        activeService.getRoles(),
      ]);

      const currentUserEmail = accounts[0]?.username;
      const userRoles = activeService.permissionService.getUserRoles(currentUserEmail);

      let userDeptRole = null;

      if (userRoles.length > 0) {
        const gerenciaGeneralRole = userRoles.find(r => r.roleType === 'GerenciaGeneral');
        const gerenciaRole = userRoles.find(r => r.roleType === 'Gerencia');
        const adminRole = userRoles.find(r => r.roleType === 'Administrador');
        const jefaturaRole = userRoles.find(r => r.roleType === 'Jefatura');
        const colaboradorRole = userRoles.find(r => r.roleType === 'Colaborador' || r.roleType === 'AsistenteJefatura');

        const primaryRole = gerenciaGeneralRole || gerenciaRole || adminRole || jefaturaRole || colaboradorRole;

        if (primaryRole) {
          const department = departmentsData.find(
            dept => parseInt(dept.id, 10) === primaryRole.departmentId
          );

          // chainRole: el rol más alto en la cadena de aprobación (ignorando Administrador),
          // usado para determinar quién debe aprobar la solicitud de ESTE usuario
          const chainRoleOrder = ['GerenciaGeneral', 'Gerencia', 'Jefatura'];
          const allRoleTypes = userRoles.map(r => r.roleType);
          const chainRole = chainRoleOrder.find(r => allRoleTypes.includes(r)) || 'Colaborador';

          userDeptRole = {
            role: primaryRole.roleType,
            chainRole,
            department,
            allRoles: allRoleTypes,
          };
        }
      }

      dispatch({ type: ACTIONS.SET_VACACIONES, payload: requestsData });
      dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: departmentsData });
      dispatch({ type: ACTIONS.SET_ROLES, payload: rolesData });
      dispatch({ type: ACTIONS.SET_USER_ROLE, payload: userDeptRole });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Error loading vacaciones data:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Error al cargar los datos de vacaciones' });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [accounts, service]);

  const createRequest = useCallback(async (requestData) => {
    if (!service) throw new Error('Service not initialized');
    const newRequest = await service.createVacacionesRequest(requestData);
    await loadVacacionesData();
    // Notificación Teams (no bloquea el flujo si falla)
    Promise.resolve()
      .then(() => service.notifyNewRequest?.(requestData))
      .catch(err => console.warn('notifyNewRequest falló:', err));
    return newRequest;
  }, [service, loadVacacionesData]);

  const updateRequest = useCallback(async (id, updateData) => {
    if (!service) throw new Error('Service not initialized');
    const updated = await service.updateVacacionesRequest(id, updateData);
    await loadVacacionesData();
    return updated;
  }, [service, loadVacacionesData]);

  const updateApprovalStatus = useCallback(async (id, approvalType, status) => {
    if (!service) throw new Error('Service not initialized');
    // Captura snapshot ANTES del patch para construir la notificación correctamente
    const snapshot = requestsRef.current.find(r => r.id === id) || null;
    const updated = await service.updateApprovalStatus(id, approvalType, status);
    await loadVacacionesData();
    if (snapshot) {
      service.notifyApprovalChange(snapshot, approvalType, status).catch(err =>
        console.warn('notifyApprovalChange falló:', err)
      );
    }
    return updated;
  }, [service, loadVacacionesData]);

  useEffect(() => {
    const initAndLoad = async () => {
      if (hasLoadedData.current) return;
      if (!accounts || accounts.length === 0) return;

      try {
        const vacacionesService = new VacacionesService(instance, vacacionesConfig);
        await vacacionesService.initialize();

        setService(vacacionesService);
        dispatch({ type: ACTIONS.SET_INITIALIZED, payload: true });

        hasLoadedData.current = true;
        await loadVacacionesData(vacacionesService);
      } catch (error) {
        hasLoadedData.current = false;
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Error al inicializar el servicio' });
      }
    };

    initAndLoad();
  }, [accounts, instance, loadVacacionesData]);

  const value = {
    vacacionesRequests: state.vacacionesRequests,
    departments: state.departments,
    roles: state.roles,
    userDepartmentRole: state.userDepartmentRole,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    service,
    permissionService: service?.permissionService,
    loadVacacionesData,
    createRequest,
    updateRequest,
    updateApprovalStatus,
  };

  return (
    <VacacionesContext.Provider value={value}>
      {children}
    </VacacionesContext.Provider>
  );
}

export function useVacaciones() {
  const context = useContext(VacacionesContext);
  if (!context) {
    throw new Error('useVacaciones must be used within VacacionesProvider');
  }
  return context;
}

export default VacacionesContext;

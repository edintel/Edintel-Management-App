
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useMsal } from "@azure/msal-react";
import ExtraHoursService from "../components/Service/ExtraHoursService";
import { extraHoursConfig } from "../config/extraHours.config";

// Create context
const ExtraHoursContext = createContext(null);

// Action types
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_EXTRA_HOURS: "SET_EXTRA_HOURS",
  SET_DEPARTMENTS: "SET_DEPARTMENTS",
  SET_ROLES: "SET_ROLES",
  SET_USER_ROLE: "SET_USER_ROLE",
  SET_INITIALIZED: "SET_INITIALIZED",
  UPDATE_REQUEST: "UPDATE_REQUEST",
  ADD_REQUEST: "ADD_REQUEST",
  DELETE_REQUEST: "DELETE_REQUEST",
};

// Initial state
const initialState = {
  extraHoursRequests: [],
  departments: [],
  roles: [],
  userDepartmentRole: null,
  loading: true,
  error: null,
  initialized: false,
};

// Reducer function
function extraHoursReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_EXTRA_HOURS:
      return { ...state, extraHoursRequests: action.payload };

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
        extraHoursRequests: state.extraHoursRequests.map((req) =>
          req.id === action.payload.id ? { ...req, ...action.payload } : req
        ),
      };

    case ACTIONS.ADD_REQUEST:
      return {
        ...state,
        extraHoursRequests: [action.payload, ...state.extraHoursRequests],
      };

    case ACTIONS.DELETE_REQUEST:
      return {
        ...state,
        extraHoursRequests: state.extraHoursRequests.filter(
          (req) => req.id !== action.payload
        ),
      };

    default:
      return state;
  }
}

// Provider component
export function ExtraHoursProvider({ children }) {
  const [state, dispatch] = useReducer(extraHoursReducer, initialState);
  const { instance, accounts } = useMsal();
  const [service, setService] = React.useState(null);
  const hasLoadedData = useRef(false);

  // ✅ Load all data - MODIFICADO para aceptar servicio como parámetro
  const loadExtraHoursData = useCallback(async (serviceInstance = null) => {
    const activeService = serviceInstance || service;

    if (!activeService || !accounts[0]?.username) {
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const [requestsData, departmentsData, rolesData] = await Promise.all([
        activeService.getExtraHoursRequests(),
        activeService.getDepartments(),
        activeService.getRoles(),
      ]);

      const currentUserEmail = accounts[0]?.username;

      // Get user roles and determine primary role
      const userRoles = activeService.permissionService.getUserRoles(currentUserEmail);

      let userDeptRole = null;

      if (userRoles.length > 0) {
        // Prioritize roles: Administrador > Jefatura > AsistenteJefatura > Colaborador
        const adminRole = userRoles.find(
          (role) => role.roleType === "Administrador"
        );

        const jefaturaRole = userRoles.find(
          (role) => role.roleType === "Jefatura"
        );

        const asistenteRole = userRoles.find(
          (role) => role.roleType === "AsistenteJefatura"
        );

        const selectedRole = adminRole || jefaturaRole || asistenteRole || userRoles[0];

        userDeptRole = {
          department: selectedRole.department,
          role: selectedRole.roleType,  // ✅ Esto debería ser un STRING, no un array
        };
      }

      // Filter requests based on user's role and permissions
      const filteredRequests = activeService.filterRequestsByDepartment(
        requestsData,
        userDeptRole
      );

      dispatch({ type: ACTIONS.SET_EXTRA_HOURS, payload: filteredRequests });
      dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: departmentsData });
      dispatch({ type: ACTIONS.SET_ROLES, payload: rolesData });
      dispatch({ type: ACTIONS.SET_USER_ROLE, payload: userDeptRole });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: "Error al cargar los datos",
      });
    }
  }, [service, accounts]);

  // Create new request
  const createRequest = useCallback(
    async (requestData) => {
      if (!service) throw new Error("Service not initialized");

      try {
        const newRequest = await service.createExtraHoursRequest(requestData);
        // Reload data to get the formatted request
        await loadExtraHoursData();
        return newRequest;
      } catch (error) {
        throw error;
      }
    },
    [service, loadExtraHoursData]
  );

  // Update request
  const updateRequest = useCallback(
    async (id, updateData) => {
      if (!service) throw new Error("Service not initialized");

      try {
        const updatedRequest = await service.updateExtraHoursRequest(
          id,
          updateData
        );
        // Reload data to get updated request
        await loadExtraHoursData();
        return updatedRequest;
      } catch (error) {
        throw error;
      }
    },
    [service, loadExtraHoursData]
  );

  // Update approval status
  const updateApprovalStatus = useCallback(
    async (id, approvalType, status) => {
      if (!service) throw new Error("Service not initialized");

      try {
        const updatedRequest = await service.updateApprovalStatus(
          id,
          approvalType,
          status
        );
        // Reload data to reflect changes
        await loadExtraHoursData();
        return updatedRequest;
      } catch (error) {
        throw error;
      }
    },
    [service, loadExtraHoursData]
  );

  // ✅ Efecto unificado: Inicializar y cargar datos
  useEffect(() => {
    const initAndLoad = async () => {
      // Solo ejecutar una vez
      if (hasLoadedData.current) {
        return;
      }

      // Verificar que tenemos cuenta
      if (!accounts || accounts.length === 0) {
        return;
      }

      try {
        // Inicializar servicio
        const extraHoursService = new ExtraHoursService(
          instance,
          extraHoursConfig
        );
        await extraHoursService.initialize();

        // ✅ Actualizar estado del servicio
        setService(extraHoursService);
        dispatch({ type: ACTIONS.SET_INITIALIZED, payload: true });

        // ✅ Cargar datos INMEDIATAMENTE con el servicio recién creado
        hasLoadedData.current = true;
        await loadExtraHoursData(extraHoursService); // ⭐ Pasar el servicio directamente

      } catch (error) {
        hasLoadedData.current = false; // Permitir reintentar
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: "Error al inicializar el servicio",
        });
      }
    };

    initAndLoad();
  }, [accounts, instance, loadExtraHoursData]);

  const value = {
    // State
    extraHoursRequests: state.extraHoursRequests,
    departments: state.departments,
    roles: state.roles,
    userDepartmentRole: state.userDepartmentRole,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,

    // Service
    service,
    permissionService: service?.permissionService,

    // Actions
    loadExtraHoursData,
    createRequest,
    updateRequest,
    updateApprovalStatus,
  };

  return (
    <ExtraHoursContext.Provider value={value}>
      {children}
    </ExtraHoursContext.Provider>
  );
}

// Custom hook to use the context
export function useExtraHours() {
  const context = useContext(ExtraHoursContext);
  if (!context) {
    throw new Error("useExtraHours must be used within ExtraHoursProvider");
  }
  return context;
}

export default ExtraHoursContext;
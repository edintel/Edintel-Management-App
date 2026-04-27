import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useMsal } from '@azure/msal-react';
import IncapacidadesService from '../components/Service/IncapacidadesService';
import { incapacidadesConfig } from '../config/incapacidades.config';

const IncapacidadesContext = createContext(null);

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_REQUESTS: 'SET_REQUESTS',
  SET_USER_ROLE: 'SET_USER_ROLE',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

const initialState = {
  requests: [],
  userRole: null,
  loading: true,
  error: null,
  initialized: false,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_REQUESTS:
      return { ...state, requests: action.payload };
    case ACTIONS.SET_USER_ROLE:
      return { ...state, userRole: action.payload };
    case ACTIONS.SET_INITIALIZED:
      return { ...state, initialized: action.payload };
    default:
      return state;
  }
}

export function IncapacidadesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { instance, accounts } = useMsal();
  const [service, setService] = React.useState(null);
  const hasLoaded = useRef(false);

  const loadData = useCallback(async (svc = null) => {
    const activeService = svc || service;
    if (!activeService || !accounts[0]?.username) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const email = accounts[0].username;
      const rawRequests = await activeService.getIncapacidadesRequests();
      const role = activeService.getUserRole(email);
      const filtered = activeService.filterRequestsByUser(rawRequests, email, role);

      dispatch({ type: ACTIONS.SET_REQUESTS, payload: filtered });
      dispatch({ type: ACTIONS.SET_USER_ROLE, payload: role });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (err) {
      console.error('Error loading incapacidades:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Error al cargar los datos' });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [accounts, service]);

  const createRequest = useCallback(async (requestData, files = []) => {
    if (!service) throw new Error('Service not initialized');
    const created = await service.createIncapacidadRequest(requestData);
    const itemId = created.id;

    if (files.length > 0) {
      const uploaded = [];
      for (const file of files) {
        try {
          const info = await service.uploadComprobante(itemId, file);
          uploaded.push(info);
        } catch (err) {
          console.error('Error subiendo comprobante:', err);
        }
      }
      if (uploaded.length > 0) {
        await service.updateComprobantes(itemId, uploaded);
      }
    }

    await loadData();
    // Notificación Teams a RH (no bloquea el flujo si falla)
    Promise.resolve()
      .then(() => service.notifyNewIncapacidad?.(requestData))
      .catch(err => console.warn('notifyNewIncapacidad falló:', err));
    return created;
  }, [service, loadData]);

  const markRecibido = useCallback(async (id) => {
    if (!service) throw new Error('Service not initialized');
    const userEmail = accounts[0]?.username || '';
    const roles = service._roles || [];
    const found = roles.find(r => r.empleado?.email === userEmail);
    const nombre = found?.empleado?.displayName || userEmail;
    await service.markRecibido(id, nombre);
    await loadData();
  }, [service, accounts, loadData]);

  useEffect(() => {
    const init = async () => {
      if (hasLoaded.current) return;
      if (!accounts || accounts.length === 0) return;

      try {
        const svc = new IncapacidadesService(instance, incapacidadesConfig);
        await svc.initialize();
        setService(svc);
        dispatch({ type: ACTIONS.SET_INITIALIZED, payload: true });
        hasLoaded.current = true;
        await loadData(svc);
      } catch (err) {
        hasLoaded.current = false;
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Error al inicializar el servicio' });
      }
    };
    init();
  }, [accounts, instance, loadData]);

  const value = {
    requests: state.requests,
    userRole: state.userRole,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    service,
    loadData,
    createRequest,
    markRecibido,
  };

  return (
    <IncapacidadesContext.Provider value={value}>
      {children}
    </IncapacidadesContext.Provider>
  );
}

export function useIncapacidades() {
  const ctx = useContext(IncapacidadesContext);
  if (!ctx) throw new Error('useIncapacidades must be used within IncapacidadesProvider');
  return ctx;
}

export default IncapacidadesContext;

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useMsal } from "@azure/msal-react";
import CursoControlService from "../components/services/CursoControlService";
import { cursoControlConfig } from "../config/cursoControl.config";
const CursoControlContext = createContext();
export function useCursoControl() {
  return useContext(CursoControlContext);
}
const normalizeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};
export function CursoControlProvider({ children }) {
  const { instance, accounts } = useMsal();
  const [initialized, setInitialized] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [service, setService] = useState(null);
  const [state, setState] = useState({
    cursos: [],
    personas: [],
    empresas: [],
    cursosTipos: [], // Added curso types array
    loading: false,
    error: null,
    filters: {
      curso: "",
      persona: "",
      empresa: "",
    },
    personasFilters: {
      empresa: "",
    },
    currentPage: 1,
    personasCurrentPage: 1,
    itemsPerPage: 10,
  });
  // Initialize service
  useEffect(() => {
    if (!instance || accounts.length === 0) return;
    const initService = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const cursoService = new CursoControlService(
          instance,
          cursoControlConfig
        );
        await cursoService.initialize();
        setService(cursoService);
        setInitialized(true);
        setState((prev) => ({ ...prev, loading: false }));
      } catch (error) {
        console.error("Error initializing curso control service:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize data",
          loading: false,
        }));
      }
    };
    initService();
  }, [instance, accounts]);
  const processData = useCallback((cursosData, personasData) => {
    const personasById = {};
    personasData.forEach((persona) => {
      personasById[persona.id] = persona;
    });
    const personasByNormalizedTitle = {};
    personasData.forEach((persona) => {
      const normalizedTitle = normalizeString(persona.title);
      personasByNormalizedTitle[normalizedTitle] = persona;
    });
    const processedCursos = cursosData.map((curso) => {
      let matchedPersona = null;
      if (curso.personaId) {
        matchedPersona = personasById[curso.personaId];
      }
      if (!matchedPersona && curso.title) {
        const normalizedTitle = normalizeString(curso.title);
        matchedPersona = personasByNormalizedTitle[normalizedTitle];
      }
      return {
        ...curso,
        personaId: matchedPersona?.id || curso.personaId || null,
        personaTitle: matchedPersona?.title || curso.title || "",
        empresa: matchedPersona?.empresa || "",
      };
    });
    return {
      processedCursos,
      processedPersonas: personasData,
    };
  }, []);
  const refreshData = useCallback(
    async (force = false) => {
      if (!service) return;
      if (dataLoaded && !force) return;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        // Set a timeout to ensure we don't get stuck in loading state
        const loadingTimeout = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              "La carga de datos está tomando más tiempo de lo esperado o no hay datos disponibles.",
          }));
        }, 10000); // 10 seconds timeout

        // Add cursosTipos to the Promise.all array
        const [cursosData, personasData, cursosTiposData] = await Promise.all([
          service.getCursos(),
          service.getPersonas(),
          service.getCursosTipos(), // New method to get course types
        ]);

        // Clear the timeout since we got data
        clearTimeout(loadingTimeout);

        // Handle empty data case explicitly
        if (cursosData.length === 0 && personasData.length === 0) {
          console.log("No data found in either cursos or personas lists");
          setState((prev) => ({
            ...prev,
            cursos: [],
            personas: [],
            empresas: [],
            cursosTipos: cursosTiposData || [], // Include course types even if other data is empty
            loading: false,
            error: null,
          }));
          setDataLoaded(true);
          return;
        }

        const sortedPersonas = personasData
          .map((p) => ({
            ...p,
            title: p.title?.trim() || "",
            empresa: p.empresa?.trim() || "Edintel",
          }))
          .sort((a, b) => a.title.localeCompare(b.title));

        const uniqueEmpresas = [
          ...new Set(
            sortedPersonas
              .map((p) => p.empresa)
              .filter(Boolean)
              .map((e) => e.trim())
          ),
        ].sort();

        const { processedCursos } = processData(cursosData, sortedPersonas);

        // Get unique course types from existing cursos (as a fallback)
        const existingCursoTypes = [
          ...new Set(processedCursos.map((c) => c.curso).filter(Boolean)),
        ].sort();

        // Use the dedicated list if available, otherwise use existing curso data
        const finalCursoTypes =
          cursosTiposData.length > 0 ? cursosTiposData : existingCursoTypes;

        setState((prev) => ({
          ...prev,
          cursos: processedCursos,
          personas: sortedPersonas,
          empresas: uniqueEmpresas,
          cursosTipos: finalCursoTypes, // Add course types to state
          loading: false,
          error: null,
        }));

        setDataLoaded(true);
      } catch (error) {
        console.error("Error refreshing data:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to refresh data: " + (error.message || error),
          loading: false,
        }));
      }
    },
    [service, processData]
  );
  const setFilters = useCallback((newFilters) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      currentPage: 1,
      loading: false,
    }));
  }, []);
  const setPersonasFilters = useCallback((newFilters) => {
    setState((prev) => ({
      ...prev,
      personasFilters: { ...prev.personasFilters, ...newFilters },
      personasCurrentPage: 1,
    }));
  }, []);
  const getFilteredCursos = useCallback(() => {
    const { cursos, filters, personas } = state;
    const filteredResults = cursos.filter((curso) => {
      if (
        filters.curso === "Pendiente" &&
        (!curso.curso || curso.curso.trim() === "")
      ) {
        return true;
      }
      if (
        filters.curso &&
        filters.curso !== "Pendiente" &&
        curso.curso !== filters.curso
      ) {
        return false;
      }
      if (filters.persona && curso.personaTitle !== filters.persona) {
        return false;
      }
      if (filters.empresa && curso.empresa !== filters.empresa) {
        return false;
      }
      return true;
    });
    if (filters.curso && filters.curso !== "Pendiente" && filters.empresa) {
      const empresaPersonas = personas.filter(
        (p) => p.empresa === filters.empresa
      );
      const personasWithCurso = new Set(
        cursos
          .filter(
            (c) => c.curso === filters.curso && c.empresa === filters.empresa
          )
          .map((c) => c.personaTitle)
      );
      empresaPersonas.forEach((persona) => {
        if (!personasWithCurso.has(persona.title)) {
          filteredResults.push({
            id: `virtual-${persona.id}`,
            personaId: persona.id,
            personaTitle: persona.title,
            empresa: persona.empresa,
            curso: filters.curso,
            fecha: null,
            isVirtual: true,
          });
        }
      });
    }
    return filteredResults;
  }, [state]);
  const getFilteredPersonas = useCallback(() => {
    const { personas, personasFilters } = state;
    return personas.filter((persona) => {
      if (
        personasFilters.empresa &&
        persona.empresa !== personasFilters.empresa
      ) {
        return false;
      }
      return true;
    });
  }, [state]);
  const createCurso = useCallback(
    async (cursoData) => {
      if (!service) return null;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const result = await service.createCurso(cursoData);
        await refreshData(true);
        return result;
      } catch (error) {
        console.error("Error creating curso:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to create curso",
          loading: false,
        }));
        return null;
      }
    },
    [service, refreshData]
  );
  const updateCurso = useCallback(
    async (id, cursoData) => {
      if (!service) return null;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const result = await service.updateCurso(id, cursoData);
        await refreshData(true);
        return result;
      } catch (error) {
        console.error("Error updating curso:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to update curso",
          loading: false,
        }));
        return null;
      }
    },
    [service, refreshData]
  );
  const deleteCurso = useCallback(
    async (id) => {
      if (!service) return false;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        await service.deleteCurso(id);
        await refreshData(true);
        return true;
      } catch (error) {
        console.error("Error deleting curso:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to delete curso",
          loading: false,
        }));
        return false;
      }
    },
    [service, refreshData]
  );
  const createPersona = useCallback(
    async (personaData) => {
      if (!service) return null;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const result = await service.createPersona(personaData);
        await refreshData(true);
        return result;
      } catch (error) {
        console.error("Error creating persona:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to create persona",
          loading: false,
        }));
        return null;
      }
    },
    [service, refreshData]
  );
  const updatePersona = useCallback(
    async (id, personaData) => {
      if (!service) return null;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const result = await service.updatePersona(id, personaData);
        await refreshData(true);
        return result;
      } catch (error) {
        console.error("Error updating persona:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to update persona",
          loading: false,
        }));
        return null;
      }
    },
    [service, refreshData]
  );
  const deletePersona = useCallback(
    async (id) => {
      if (!service) return false;
      try {
        setState((prev) => ({ ...prev, loading: true }));
        await service.deletePersona(id);
        await refreshData(true);
        return true;
      } catch (error) {
        console.error("Error deleting persona:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to delete persona",
          loading: false,
        }));
        return false;
      }
    },
    [service, refreshData]
  );
  useEffect(() => {
    if (initialized && !dataLoaded && !state.loading) {
      refreshData();
    }
  }, [initialized, dataLoaded, state.loading, refreshData]);
  const contextValue = {
    ...state,
    initialized,
    dataLoaded,
    refreshData,
    setFilters,
    setPersonasFilters,
    getFilteredCursos,
    getFilteredPersonas,
    createCurso,
    updateCurso,
    deleteCurso,
    createPersona,
    updatePersona,
    deletePersona,
    setState,
  };
  return (
    <CursoControlContext.Provider value={contextValue}>
      {children}
    </CursoControlContext.Provider>
  );
}

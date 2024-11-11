import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import PostVentaManagementService from "../components/services/postVentaManagementService";
import { postVentaConfig } from "../config/postVentaManagement.config";

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProviderPostVentaManagement({ children }) {
  const { instance, accounts } = useMsal();
  const [initialized, setInitialized] = useState(false);
  const [services, setServices] = useState({
    postVenta: { service: null, initialized: false, initializing: false },
  });

  const [postVentaState, setPostVentaState] = useState({
    companies: [],
    buildings: [],
    systems: [],
    sites: [],
    roles: [],
    serviceTickets: [],
    userRole: null,
    loading: false,
    error: null,
  });

  const updateServiceTickets = useCallback((updaterFn) => {
    setPostVentaState((prev) => ({
      ...prev,
      serviceTickets:
        typeof updaterFn === "function"
          ? updaterFn(prev.serviceTickets)
          : updaterFn,
    }));
  }, []);

  const initializePostVentaService = useCallback(async () => {
    if (!instance || accounts.length === 0) return null;
    if (services.postVenta.initialized) return services.postVenta.service;
    if (services.postVenta.initializing) return null;

    try {
      setServices((prev) => ({
        ...prev,
        postVenta: { ...prev.postVenta, initializing: true },
      }));

      const postVentaService = new PostVentaManagementService(instance, postVentaConfig);
      await postVentaService.initialize();

      setServices((prev) => ({
        ...prev,
        postVenta: {
          service: postVentaService,
          initialized: true,
          initializing: false,
        },
      }));

      return postVentaService;
    } catch (error) {
      console.error("Error initializing post venta service:", error);
      setServices((prev) => ({
        ...prev,
        postVenta: { service: null, initialized: false, initializing: false },
      }));
      return null;
    }
  }, [instance, accounts, services.postVenta.initialized, services.postVenta.initializing, services.postVenta.service]);

  const loadPostVentaData = useCallback(async () => {
    if (postVentaState.loading) return;

    const service = await initializePostVentaService();
    if (!service) return;

    setPostVentaState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [
        companiesData,
        buildingsData,
        systemsData,
        sitesData,
        rolesData,
        serviceTicketsData,
      ] = await Promise.all([
        service.getCompanies(),
        service.getBuildings(),
        service.getSystems(),
        service.getSites(),
        service.getRoles(),
        service.getServiceTickets(),
      ]);

      const currentUserEmail = accounts[0]?.username;
      const userRole = rolesData.find(
        (role) => role.employee?.Email === currentUserEmail
      );

      setPostVentaState({
        companies: companiesData,
        buildings: buildingsData,
        systems: systemsData,
        sites: sitesData,
        roles: rolesData,
        serviceTickets: serviceTicketsData,
        userRole: userRole,
        loading: false,
        error: null,
      });
      setInitialized(true);
    } catch (error) {
      console.error("Error loading post venta data:", error);
      setPostVentaState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load post venta data",
      }));
      setInitialized(true);
    }
  }, [accounts, initializePostVentaService, postVentaState.loading]);

  // Initialize data when component mounts
  useEffect(() => {
    if (!initialized && !postVentaState.loading && accounts.length > 0) {
      loadPostVentaData();
    }
  }, [initialized, accounts, loadPostVentaData, postVentaState.loading]);

  const value = {
    services: { postVenta: services.postVenta.service },
    postVentaState,
    initialized,
    initializePostVentaService,
    loadPostVentaData,
    updateServiceTickets,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function usePostVentaManagement() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("usePostVentaManagement must be used within AppProviderPostVentaManagement");
  }

  const {
    services: { postVenta: service },
    postVentaState: {
      companies,
      buildings,
      systems,
      sites,
      roles,
      serviceTickets,
      userRole,
      loading,
      error,
    },
    initialized,
    updateServiceTickets,
    loadPostVentaData,
  } = context;

  // Helper function to get hierarchical structure of companies -> buildings -> sites
  const getCompanyHierarchy = useCallback(() => {
    return companies.map(company => ({
      ...company,
      buildings: buildings
        .filter(building => building.companyId === parseInt(company.id))
        .map(building => ({
          ...building,
          sites: sites.filter(site => site.buildingId === parseInt(building.id))
        }))
    }));
  }, [companies, buildings, sites]);

  const getTicketsAssignedToMe = useCallback(() => {
    if (!userRole?.employee?.LookupId) return [];

    return serviceTickets.filter(ticket => 
      ticket.technicians.some(tech => tech.LookupId === userRole.employee.LookupId)
    );
  }, [serviceTickets, userRole]);

  const getSiteDetails = useCallback((siteId) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return null;

    const building = buildings.find(b => b.id === site.buildingId);
    const company = building ? companies.find(c => c.id === building.companyId) : null;

    return {
      site,
      building,
      company,
      systems: Array.isArray(site.systems) 
        ? systems.filter(sys => site.systems.includes(sys.name))
        : []
    };
  }, [sites, buildings, companies, systems]);

  return {
    service,
    companies,
    buildings,
    systems,
    sites,
    roles,
    serviceTickets,
    userRole,
    loading,
    error,
    initialized,
    setServiceTickets: updateServiceTickets,
    loadPostVentaData,
    // Additional helper functions
    getCompanyHierarchy,
    getTicketsAssignedToMe,
    getSiteDetails,
  };
}
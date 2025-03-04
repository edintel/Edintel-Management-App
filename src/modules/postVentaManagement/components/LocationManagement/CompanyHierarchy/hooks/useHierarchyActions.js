import { useState, useCallback } from "react";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";

export const MODAL_TYPES = {
  ADD_COMPANY: "add-company",
  EDIT_COMPANY: "edit-company",
  DELETE_COMPANY: "delete-company",
  ADD_BUILDING: "add-building",
  EDIT_BUILDING: "edit-building",
  DELETE_BUILDING: "delete-building",
  ADD_SITE: "add-site",
  EDIT_SITE: "edit-site",
  DELETE_SITE: "delete-site",
};

export const useHierarchyActions = () => {
  const { service, loadPostVentaData, userRole } = usePostVentaManagement();
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has permissions to perform CRUD actions
  const hasPermission = userRole?.role === "Administrativo" || 
                       userRole?.role === "Supervisor" || 
                       userRole?.role === "Comercial";

  const openModal = useCallback((type, item = null, parentId = null) => {
    if (!hasPermission) {
      setError("No tienes permisos para realizar esta acción");
      return;
    }
    
    setCurrentModal({ type, parentId });
    setSelectedItem(item);
    setError(null);
  }, [hasPermission]);

  const closeModal = useCallback(() => {
    setCurrentModal(null);
    setSelectedItem(null);
    setError(null);
    setProcessing(false);
  }, []);

  const handleAddCompany = useCallback(
    async (data) => {
      if (!hasPermission) {
        setError("No tienes permisos para realizar esta acción");
        return;
      }
      
      setProcessing(true);
      setError(null);
      try {
        await service.createCompany(data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, closeModal, loadPostVentaData, hasPermission]
  );

  const handleEditCompany = useCallback(
    async (data) => {
      if (!hasPermission || !selectedItem?.id) {
        setError("No tienes permisos para realizar esta acción");
        return;
      }
      
      setProcessing(true);
      setError(null);
      try {
        await service.updateCompany(selectedItem.id, data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, selectedItem, closeModal, loadPostVentaData, hasPermission]
  );

  const handleDeleteCompany = useCallback(async () => {
    if (!hasPermission || !selectedItem?.id) {
      setError("No tienes permisos para realizar esta acción");
      return;
    }
    
    setProcessing(true);
    setError(null);
    try {
      await service.deleteCompany(selectedItem.id);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, selectedItem, closeModal, loadPostVentaData, hasPermission]);

  const handleAddBuilding = useCallback(
    async (data) => {
      if (!hasPermission) {
        setError("No tienes permisos para realizar esta acción");
        return;
      }
      
      setProcessing(true);
      setError(null);
      try {
        await service.createBuilding(data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, closeModal, loadPostVentaData, hasPermission]
  );

  const handleEditBuilding = useCallback(
    async (data) => {
      if (!hasPermission || !selectedItem?.id) {
        setError("No tienes permisos para realizar esta acción");
        return;
      }
      
      setProcessing(true);
      setError(null);
      try {
        await service.updateBuilding(selectedItem.id, data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, selectedItem, closeModal, loadPostVentaData, hasPermission]
  );

  const handleDeleteBuilding = useCallback(async () => {
    if (!hasPermission || !selectedItem?.id) {
      setError("No tienes permisos para realizar esta acción");
      return;
    }
    
    setProcessing(true);
    setError(null);
    try {
      await service.deleteBuilding(selectedItem.id);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, selectedItem, closeModal, loadPostVentaData, hasPermission]);

  const handleAddSite = useCallback(
    async (data) => {
      if (!hasPermission) {
        setError("No tienes permisos para realizar esta acción");
        return;
      }
      
      setProcessing(true);
      setError(null);
      try {
        await service.createSite(data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, closeModal, loadPostVentaData, hasPermission]
  );

  const handleEditSite = useCallback(
    async (data) => {
      if (!hasPermission || !selectedItem?.id) {
        setError("No tienes permisos para realizar esta acción");
        return;
      }
      
      setProcessing(true);
      setError(null);
      try {
        await service.updateSite(selectedItem.id, data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, selectedItem, closeModal, loadPostVentaData, hasPermission]
  );

  const handleDeleteSite = useCallback(async () => {
    if (!hasPermission || !selectedItem?.id) {
      setError("No tienes permisos para realizar esta acción");
      return;
    }
    
    setProcessing(true);
    setError(null);
    try {
      await service.deleteSite(selectedItem.id);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, selectedItem, closeModal, loadPostVentaData, hasPermission]);

  return {
    currentModal,
    selectedItem,
    processing,
    error,
    openModal,
    closeModal,
    handleAddCompany,
    handleEditCompany,
    handleDeleteCompany,
    handleAddBuilding,
    handleEditBuilding,
    handleDeleteBuilding,
    handleAddSite,
    handleEditSite,
    handleDeleteSite,
    hasPermission,
  };
};
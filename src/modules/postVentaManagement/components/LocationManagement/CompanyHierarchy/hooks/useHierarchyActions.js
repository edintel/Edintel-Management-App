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
  const { service, loadPostVentaData } = usePostVentaManagement();

  // Modal state
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Modal handlers
  const openModal = useCallback((type, item = null, parentId = null) => {
    setCurrentModal({ type, parentId });
    setSelectedItem(item);
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setCurrentModal(null);
    setSelectedItem(null);
    setError(null);
    setProcessing(false);
  }, []);

  // Company actions
  const handleAddCompany = useCallback(
    async (data) => {
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
    [service, closeModal, loadPostVentaData]
  );

  const handleEditCompany = useCallback(
    async (data) => {
      if (!selectedItem?.id) return;
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
    [service, selectedItem, closeModal, loadPostVentaData]
  );

  const handleDeleteCompany = useCallback(async () => {
    if (!selectedItem?.id) return;
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
  }, [service, selectedItem, closeModal, loadPostVentaData]);

  // Building actions
  const handleAddBuilding = useCallback(
    async (data) => {
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
    [service, closeModal, loadPostVentaData]
  );

  const handleEditBuilding = useCallback(
    async (data) => {
      if (!selectedItem?.id) return;
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
    [service, selectedItem, closeModal, loadPostVentaData]
  );

  const handleDeleteBuilding = useCallback(async () => {
    if (!selectedItem?.id) return;
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
  }, [service, selectedItem, closeModal, loadPostVentaData]);

  // Site actions
  const handleAddSite = useCallback(
    async (data) => {
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
    [service, closeModal, loadPostVentaData]
  );

  const handleEditSite = useCallback(
    async (data) => {
      if (!selectedItem?.id) return;
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
    [service, selectedItem, closeModal, loadPostVentaData]
  );

  const handleDeleteSite = useCallback(async () => {
    if (!selectedItem?.id) return;
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
  }, [service, selectedItem, closeModal, loadPostVentaData]);

  return {
    // Modal state
    currentModal,
    selectedItem,
    processing,
    error,

    // Modal handlers
    openModal,
    closeModal,

    // Company actions
    handleAddCompany,
    handleEditCompany,
    handleDeleteCompany,

    // Building actions
    handleAddBuilding,
    handleEditBuilding,
    handleDeleteBuilding,

    // Site actions
    handleAddSite,
    handleEditSite,
    handleDeleteSite,
  };
};

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useExpenseAudit } from '../../../context/expenseAuditContext';
import { useLocation } from 'react-router-dom';

export const useApprovalList = () => {
  const location = useLocation();
  const {
    expenseReports, 
    departmentWorkers, 
    loading, 
    setExpenseReports,
    service,
    permissionService,
    approvalFlowService,
    userDepartmentRole,
    approvalFilters,
    setApprovalFilters
  } = useExpenseAudit();

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  // Local filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("pending");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [startDate, setStartDate] = useState(
    lastWeek.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  
  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "approve",
    title: "",
    message: "",
    expenseId: null,
  });

  // Restore filters from state if navigating back
  useEffect(() => {
    if (location.state?.preserveFilters && approvalFilters) {
      setSearchTerm(approvalFilters.searchTerm || "");
      setStartDate(approvalFilters.startDate || "");
      setEndDate(approvalFilters.endDate || "");
      setSelectedPerson(approvalFilters.selectedPerson || "");
      setViewMode(approvalFilters.viewMode || "pending");
    }
  }, [location.state?.preserveFilters, approvalFilters]);

  // Sync local filter state to context
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setApprovalFilters({
        searchTerm,
        startDate,
        endDate,
        selectedPerson,
        viewMode
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, startDate, endDate, selectedPerson, viewMode, setApprovalFilters]);

  // People for filters
  const people = useMemo(() => {
    return departmentWorkers.reduce((acc, dept) => {
      dept.workers.forEach((worker) => {
        if (
          worker.empleado &&
          !acc.some((p) => p.email === worker.empleado.email)
        ) {
          acc.push(worker.empleado);
        }
      });
      return acc;
    }, []).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [departmentWorkers]);

  // Filtered expenses based on filters
  const filteredExpenses = useMemo(() => {
    if (!canViewApprovals() || !service) return [];
    
    const userEmail = service.msalInstance.getAllAccounts()[0]?.username;
    
    return expenseReports.filter((expense) => {
      // Date filter
      if (startDate && endDate) {
        const expenseDate = expense.fecha.getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
        if (expenseDate < start || expenseDate > end) return false;
      }
      
      // Person filter
      if (selectedPerson && expense.createdBy.email !== selectedPerson) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          expense.rubro.toLowerCase().includes(search) ||
          expense.st.toLowerCase().includes(search) ||
          expense.createdBy.name.toLowerCase().includes(search)
        );
      }
      
      // View mode filter
      switch (viewMode) {
        case "pending":
          return approvalFlowService && approvalFlowService.canApprove(expense, userEmail);
        case "approved": {
          const isAssistant = permissionService && permissionService.hasRole(userEmail, "Asistente");
          const isBoss = permissionService && permissionService.hasRole(userEmail, "Jefe");
          if (isAssistant && expense.aprobacionAsistente === "Aprobada") {
            return true;
          }
          if (isBoss && expense.aprobacionJefatura === "Aprobada") {
            return true;
          }
          return false;
        }
        case "rejected": {
          const isAssistant = permissionService && permissionService.hasRole(userEmail, "Asistente");
          const isBoss = permissionService && permissionService.hasRole(userEmail, "Jefe");
          if (isAssistant && expense.aprobacionAsistente === "No aprobada") {
            return true;
          }
          if (isBoss && expense.aprobacionJefatura === "No aprobada") {
            return true;
          }
          return false;
        }
        default:
          return true;
      }
    });
  }, [expenseReports, startDate, endDate, selectedPerson, searchTerm, viewMode, service, permissionService, approvalFlowService]);

  // Check if user can view approvals
  const canViewApprovals = useCallback(() => {
    if (!userDepartmentRole) return false;
    return userDepartmentRole.role === "Jefe" || userDepartmentRole.role === "Asistente";
  }, [userDepartmentRole]);

  // Handle approval action
  const handleApprove = useCallback((id, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: "approve",
      title: "¿Confirmar aprobación?",
      message: "¿Está seguro que desea aprobar este gasto?",
      expenseId: id,
    });
  }, []);

  // Handle reject action
  const handleReject = useCallback((id, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: "reject",
      title: "¿Confirmar rechazo?",
      message:
        "¿Está seguro que desea rechazar este gasto? Debe proporcionar una nota de revisión.",
      expenseId: id,
    });
  }, []);

  // Handle confirmation action
  const handleConfirmAction = useCallback(async (notes = "") => {
    try {
      const expense = expenseReports.find(exp => exp.id === confirmDialog.expenseId);
      if (!expense) return;
      
      const userEmail = service.msalInstance.getAllAccounts()[0]?.username;
      const approvalType = approvalFlowService.getNextApprovalType(expense, userEmail);
      
      if (!approvalType) {
        console.error("Cannot determine approval type");
        return;
      }
      
      const status = confirmDialog.type === "approve" ? "Aprobada" : "No aprobada";
      await service.updateApprovalStatus(
        confirmDialog.expenseId,
        status,
        approvalType,
        notes
      );
      
      setExpenseReports((prevReports) =>
        prevReports.map((report) => {
          if (report.id !== confirmDialog.expenseId) return report;
          
          const updatedReport = { 
            ...report, 
            bloqueoEdicion: true, 
            notasRevision: notes 
          };
          
          switch (approvalType) {
            case "assistant":
            case "accounting_assistant":
              updatedReport.aprobacionAsistente = status;
              break;
            case "boss":
            case "accounting_boss":
              updatedReport.aprobacionJefatura = status;
              if (approvalType === "accounting_boss" && status === "Aprobada") {
                updatedReport.aprobacionContabilidad = "Aprobada";
              }
              break;
            default:
              break;
          }
          
          return updatedReport;
        })
      );
      
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error updating approval status:", error);
    }
  }, [confirmDialog, expenseReports, service, approvalFlowService, setExpenseReports]);

  return {
    // Data
    filteredExpenses,
    people,
    
    // State
    searchTerm,
    viewMode,
    selectedPerson,
    startDate,
    endDate,
    confirmDialog,
    loading,
    
    // Actions
    setSearchTerm,
    setViewMode,
    setSelectedPerson,
    setStartDate,
    setEndDate,
    setConfirmDialog,
    handleApprove,
    handleReject,
    handleConfirmAction,
    canViewApprovals
  };
};

export default useApprovalList;
import { useState, useCallback, useMemo, useEffect } from "react";
import { useExpenseAudit } from "../../../context/expenseAuditContext";
import { useLocation } from "react-router-dom";
import { VIEW_MODES } from "../constants";

const PAGE_SIZE = 10; // Reduced page size for better mobile experience

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
    setApprovalFilters,
  } = useExpenseAudit();

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(VIEW_MODES.PENDING);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [startDate, setStartDate] = useState(
    lastWeek.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "approve",
    title: "",
    message: "",
    expenseId: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Restore filters from state if navigating back
  useEffect(() => {
    if (location.state?.preserveFilters && approvalFilters) {
      setSearchTerm(approvalFilters.searchTerm || "");
      setStartDate(approvalFilters.startDate || "");
      setEndDate(approvalFilters.endDate || "");
      setSelectedPerson(approvalFilters.selectedPerson || "");
      setViewMode(approvalFilters.viewMode || VIEW_MODES.PENDING);
    }
  }, [location.state?.preserveFilters, approvalFilters]);

  // Save filters to context when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setApprovalFilters({
        searchTerm,
        startDate,
        endDate,
        selectedPerson,
        viewMode,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    startDate,
    endDate,
    selectedPerson,
    viewMode,
    setApprovalFilters,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedPerson, viewMode]);

  // Memoize the user email lookup since it's used in multiple places
  const userEmail = useMemo(() => {
    return service?.msalInstance.getAllAccounts()[0]?.username;
  }, [service]);

  const approvalEligibility = useMemo(() => {
    if (
      !userEmail ||
      !permissionService ||
      !expenseReports.length ||
      !approvalFlowService
    )
      return {};

    const eligibility = {};
    for (const expense of expenseReports) {
      // Use our refactored approvalFlowService to determine eligibility
      eligibility[expense.id] = approvalFlowService.canApprove(
        expense,
        userEmail
      );
    }
    return eligibility;
  }, [expenseReports, userEmail, permissionService, approvalFlowService]);

  const people = useMemo(() => {
    return departmentWorkers
      .reduce((acc, dept) => {
        dept.workers.forEach((worker) => {
          if (
            worker.empleado &&
            !acc.some((p) => p.email === worker.empleado.email)
          ) {
            acc.push(worker.empleado);
          }
        });
        return acc;
      }, [])
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [departmentWorkers]);

  const canViewApprovals = useCallback(() => {
    if (!userDepartmentRole) return false;
    return (
      userDepartmentRole.role === "Jefe" ||
      userDepartmentRole.role === "Asistente"
    );
  }, [userDepartmentRole]);

  const filteredExpenses = useMemo(() => {
    if (!canViewApprovals() || !service || !expenseReports.length) return [];

    return expenseReports.filter((expense) => {
      // Date range filter
      if (startDate && endDate) {
        const expenseDate = expense.fecha.getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
        if (expenseDate < start || expenseDate > end) return false;
      }

      // Person filter
      if (selectedPerson && expense.createdBy.email !== selectedPerson)
        return false;

      // Search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !(
            expense.rubro.toLowerCase().includes(search) ||
            expense.st.toLowerCase().includes(search) ||
            expense.createdBy.name.toLowerCase().includes(search)
          )
        ) {
          return false;
        }
      }

      // View mode filter
      switch (viewMode) {
        case VIEW_MODES.ALL:
          return true;
        case VIEW_MODES.PENDING:
          return approvalEligibility[expense.id] === true;
        case VIEW_MODES.APPROVED: {
          return (
            expense.aprobacionAsistente === "Aprobada" ||
            expense.aprobacionJefatura === "Aprobada" ||
            expense.aprobacionContabilidad === "Aprobada"
          );
        }
        case VIEW_MODES.REJECTED: {
          return (
            expense.aprobacionAsistente === "No aprobada" ||
            expense.aprobacionJefatura === "No aprobada" ||
            expense.aprobacionContabilidad === "No aprobada"
          );
        }
        default:
          return true;
      }
    });
  }, [
    expenseReports,
    viewMode,
    selectedPerson,
    searchTerm,
    startDate,
    endDate,
    service,
    approvalEligibility,
    canViewApprovals,
  ]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredExpenses.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredExpenses, currentPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  }, [filteredExpenses]);

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

  const handleConfirmAction = useCallback(
    async (notes = "") => {
      try {
        const expense = expenseReports.find(
          (exp) => exp.id === confirmDialog.expenseId
        );
        if (!expense) return;
        const approvalType = approvalFlowService.getNextApprovalType(
          expense,
          userEmail
        );
        if (!approvalType) {
          console.error("Cannot determine approval type");
          return;
        }

        const status =
          confirmDialog.type === "approve" ? "Aprobada" : "No aprobada";
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
              notasRevision: notes,
            };

            switch (approvalType) {
              case "assistant":
              case "accounting_assistant":
                updatedReport.aprobacionAsistente = status;
                break;
              case "boss":
              case "accounting_boss":
                updatedReport.aprobacionJefatura = status;
                if (
                  approvalType === "accounting_boss" &&
                  status === "Aprobada"
                ) {
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
    },
    [
      confirmDialog,
      expenseReports,
      service,
      approvalFlowService,
      setExpenseReports,
      userEmail,
    ]
  );

  return {
    filteredExpenses,
    paginatedExpenses,
    totalPages,
    currentPage,
    setCurrentPage,
    people,
    searchTerm,
    viewMode,
    selectedPerson,
    startDate,
    endDate,
    confirmDialog,
    loading,
    approvalEligibility,
    setSearchTerm,
    setViewMode,
    setSelectedPerson,
    setStartDate,
    setEndDate,
    setConfirmDialog,
    handleApprove,
    handleReject,
    handleConfirmAction,
    canViewApprovals,
  };
};

export default useApprovalList;

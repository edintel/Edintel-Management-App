import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import DateRangePicker from "../../../../components/common/DateRangePicker";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";
import { Check, X, Eye, Search, Users } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import "./VirtualizedTable.css"; // We'll create this file later

// Define maximum rows to render at once
const PAGE_SIZE = 50;

const ApprovalList = () => {
  const navigate = useNavigate();
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

  // Local state for UI controls
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const [searchTerm, setSearchTerm] = useState(approvalFilters?.searchTerm || "");
  const [viewMode, setViewMode] = useState(approvalFilters?.viewMode || "pending");
  const [selectedPerson, setSelectedPerson] = useState(approvalFilters?.selectedPerson || "");
  const [startDate, setStartDate] = useState(
    approvalFilters?.startDate || lastWeek.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    approvalFilters?.endDate || today.toISOString().split("T")[0]
  );
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "approve",
    title: "",
    message: "",
    expenseId: null,
  });
  
  // For virtualization
  const [currentPage, setCurrentPage] = useState(1);

  // Save filters when they change
  React.useEffect(() => {
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

  // Restore filters when navigating back
  React.useEffect(() => {
    if (location.state?.preserveFilters && approvalFilters) {
      setSearchTerm(approvalFilters.searchTerm || "");
      setStartDate(approvalFilters.startDate || "");
      setEndDate(approvalFilters.endDate || "");
      setSelectedPerson(approvalFilters.selectedPerson || "");
      setViewMode(approvalFilters.viewMode || "pending");
    }
  }, [location.state?.preserveFilters, approvalFilters]);

  // Memoize user email
  const userEmail = useMemo(() => {
    return service?.msalInstance?.getAllAccounts()[0]?.username;
  }, [service]);

  // ⚡OPTIMIZATION: Pre-calculate all approval eligibility upfront
  const approvalEligibility = useMemo(() => {
    if (!userEmail || !permissionService || !expenseReports) return {};
    
    console.time('Calculate approval eligibility');
    const eligibility = {};
    
    for (const expense of expenseReports) {
      if (expense.aprobacionContabilidad === "Aprobada" ||
          expense.aprobacionAsistente === "No aprobada" ||
          expense.aprobacionJefatura === "No aprobada" ||
          expense.aprobacionContabilidad === "No aprobada") {
        eligibility[expense.id] = false;
        continue;
      }
      
      const creatorRole = permissionService.roles.find(
        role => role.empleado?.email === expense.createdBy.email
      );
      
      if (!creatorRole) {
        eligibility[expense.id] = false;
        continue;
      }
      
      const userRoles = permissionService.getUserRoles(userEmail);
      const isInSameDepartment = userRoles.some(role =>
        Number(role.departmentId) === Number(creatorRole.departamentoId)
      );
      
      if (!isInSameDepartment) {
        eligibility[expense.id] = false;
        continue;
      }
      
      const isAssistant = permissionService.hasRole(userEmail, "Asistente");
      const isBoss = permissionService.hasRole(userEmail, "Jefe");
      
      if (isAssistant && expense.aprobacionAsistente === "Pendiente") {
        eligibility[expense.id] = true;
        continue;
      }
      
      if (isBoss && expense.aprobacionJefatura === "Pendiente" &&
          (expense.aprobacionAsistente === "Aprobada" || 
           !permissionService.departmentHasAssistants(creatorRole.departamentoId))) {
        eligibility[expense.id] = true;
        continue;
      }
      
      eligibility[expense.id] = false;
    }
    
    console.timeEnd('Calculate approval eligibility');
    return eligibility;
  }, [expenseReports, userEmail, permissionService]);

  // ⚡OPTIMIZATION: Memoized people list
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

  // ⚡OPTIMIZATION: Super-efficient filtering with low-level operations
  const filteredExpenses = useMemo(() => {
    if (!userDepartmentRole || !service) return [];
    if (!expenseReports || expenseReports.length === 0) return [];
    
    // Reset to first page whenever filters change
    setCurrentPage(1);
    
    console.time('Filter expenses');
    
    // Pre-check user role permissions
    const canView = userDepartmentRole.role === "Jefe" || 
                    userDepartmentRole.role === "Asistente";
    if (!canView) return [];

    let result = [];
    
    // Convert date strings to timestamps once
    const startTimestamp = startDate ? new Date(startDate).getTime() : null;
    const endTimestamp = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) : null;
    const searchTermLower = searchTerm ? searchTerm.toLowerCase() : null;
    
    // Loop only once through expenses
    for (let i = 0; i < expenseReports.length; i++) {
      const expense = expenseReports[i];
      
      // Date filter
      if (startTimestamp && endTimestamp) {
        const expenseDate = expense.fecha.getTime();
        if (expenseDate < startTimestamp || expenseDate > endTimestamp) {
          continue;
        }
      }
      
      // Person filter
      if (selectedPerson && expense.createdBy.email !== selectedPerson) {
        continue;
      }
      
      // Search filter
      if (searchTermLower) {
        const matchesRubro = expense.rubro.toLowerCase().includes(searchTermLower);
        const matchesST = expense.st.toLowerCase().includes(searchTermLower);
        const matchesName = expense.createdBy.name.toLowerCase().includes(searchTermLower);
        
        if (!matchesRubro && !matchesST && !matchesName) {
          continue;
        }
      }
      
      // View mode filter - use pre-calculated eligibility
      switch (viewMode) {
        case "all":
          result.push(expense);
          break;
        case "pending":
          if (approvalEligibility[expense.id] === true) {
            result.push(expense);
          }
          break;
        case "approved":
          if (expense.aprobacionAsistente === "Aprobada" ||
              expense.aprobacionJefatura === "Aprobada" ||
              expense.aprobacionContabilidad === "Aprobada") {
            result.push(expense);
          }
          break;
        case "rejected":
          if (expense.aprobacionAsistente === "No aprobada" ||
              expense.aprobacionJefatura === "No aprobada" ||
              expense.aprobacionContabilidad === "No aprobada") {
            result.push(expense);
          }
          break;
        default:
          result.push(expense);
      }
    }
    
    console.timeEnd('Filter expenses');
    return result;
  }, [expenseReports, viewMode, selectedPerson, searchTerm, startDate, endDate, 
      service, userDepartmentRole, approvalEligibility]);

  // ⚡OPTIMIZATION: Pagination for virtualization
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredExpenses.slice(start, end);
  }, [filteredExpenses, currentPage]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredExpenses.length / PAGE_SIZE);
  }, [filteredExpenses]);

  // Event handlers
  const handleRowClick = useCallback((expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { from: location, preserveFilters: true },
    });
  }, [navigate, location]);

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

  const handleConfirmAction = useCallback(async (notes = "") => {
    try {
      const expense = expenseReports.find(exp => exp.id === confirmDialog.expenseId);
      if (!expense) return;
      
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
  }, [confirmDialog, expenseReports, service, approvalFlowService, setExpenseReports, userEmail]);

  // Render optimized table with virtualization
  const renderVirtualizedTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <span>Cargando datos...</span>
        </div>
      );
    }

    if (filteredExpenses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Check size={48} className="text-success mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {viewMode === "all"
              ? "No hay gastos en el sistema"
              : viewMode === "pending"
                ? "No hay gastos pendientes"
                : viewMode === "approved"
                  ? "No hay gastos aprobados"
                  : "No hay gastos rechazados"}
          </h3>
          <p className="text-sm text-gray-500">
            {viewMode === "all"
              ? "No se encontraron registros con los filtros aplicados"
              : viewMode === "pending"
                ? "Todos los gastos han sido procesados"
                : viewMode === "approved"
                  ? "Aún no hay gastos aprobados"
                  : "Aún no hay gastos rechazados"}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="virtualized-table">
          <div className="table-header">
            <div className="header-cell">Fecha</div>
            <div className="header-cell">Solicitante</div>
            <div className="header-cell">Rubro</div>
            <div className="header-cell">Monto</div>
            <div className="header-cell">ST</div>
            <div className="header-cell">F. Propios</div>
            <div className="header-cell">Estado</div>
            <div className="header-cell">Acciones</div>
          </div>
          
          <div className="table-body">
            {paginatedExpenses.map((expense) => (
              <div 
                key={expense.id} 
                className="table-row"
                onClick={() => handleRowClick(expense)}
              >
                <div className="table-cell">
                  {expense.fecha.toLocaleDateString("es-CR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
                <div className="table-cell">{expense.createdBy.name}</div>
                <div className="table-cell">{expense.rubro}</div>
                <div className="table-cell">
                  {expense.monto.toLocaleString("es-CR", {
                    style: "currency",
                    currency: "CRC",
                  })}
                </div>
                <div className="table-cell">{expense.st}</div>
                <div className="table-cell">{expense.fondosPropios ? "Si" : "No"}</div>
                <div className="table-cell">
                  {renderStatusBadge(expense)}
                </div>
                <div className="table-cell actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(expense);
                    }}
                    className="action-button view-button"
                  >
                    <Eye size={16} />
                  </button>
                  
                  {viewMode === "pending" && approvalEligibility[expense.id] && (
                    <>
                      <button
                        onClick={(e) => handleApprove(expense.id, e)}
                        className="action-button approve-button"
                      >
                        <Check size={16} />
                      </button>
                      
                      <button
                        onClick={(e) => handleReject(expense.id, e)}
                        className="action-button reject-button"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredExpenses.length > PAGE_SIZE && (
          <div className="flex justify-between items-center mt-4 p-4 border-t">
            <div className="text-sm text-gray-500">
              Mostrando {Math.min(filteredExpenses.length, (currentPage - 1) * PAGE_SIZE + 1)}-
              {Math.min(filteredExpenses.length, currentPage * PAGE_SIZE)} de {filteredExpenses.length}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="small"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <span className="text-sm mx-2">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="small"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  // Helper function to render status badge
  const renderStatusBadge = (expense) => {
    if (
      expense.aprobacionAsistente === "No aprobada" ||
      expense.aprobacionJefatura === "No aprobada" ||
      expense.aprobacionContabilidad === "No aprobada"
    ) {
      return <span className="status-badge rejected">No aprobada</span>;
    }
    
    if (expense.aprobacionContabilidad === "Aprobada") {
      return <span className="status-badge approved">Aprobado</span>;
    }
    
    if (expense.aprobacionJefatura === "Aprobada") {
      return <span className="status-badge pending">En Contabilidad</span>;
    }
    
    if (expense.aprobacionAsistente === "Aprobada") {
      return <span className="status-badge pending">En Jefatura</span>;
    }
    
    return <span className="status-badge waiting">Pendiente</span>;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} gastos{" "}
            {viewMode === "all"
              ? "en el sistema"
              : viewMode === "pending"
                ? "pendientes de aprobación"
                : viewMode === "approved"
                  ? "aprobados"
                  : "rechazados"}
          </p>
        </div>
        
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex border-b border-gray-200">
              {["all", "pending", "approved", "rejected"].map((mode) => (
                <button
                  key={mode}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    viewMode === mode
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "all" && "Todos"}
                  {mode === "pending" && "Pendientes"}
                  {mode === "approved" && "Aprobados"}
                  {mode === "rejected" && "Rechazados"}
                </button>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-4 p-4">
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Search size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar por rubro, ST o solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  maxDate={today.toISOString().split("T")[0]}
                />
              </div>
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Users size={16} className="text-gray-400 mr-2" />
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm"
                >
                  <option value="">Todos los solicitantes</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.email}>
                      {person.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          {renderVirtualizedTable()}
        </Card>
      </div>
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </>
  );
};

export default ApprovalList;
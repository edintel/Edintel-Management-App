import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import CameraUpload from "../../../../components/common/CameraUpload";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { useAuth } from "../../../../components/AuthProvider";
import MultiSelect from "../../../../components/common/MultiSelect";

const ExpenseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const {
    expenseReports,
    setExpenseReports,
    service,
    permissionService,
    loading: contextLoading,
    departmentWorkers
  } = useExpenseAudit();

  const [formData, setFormData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isNewFile, setIsNewFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currencies = [
    { code: 'CRC', symbol: '₡', name: 'Colones' },
    { code: 'USD', symbol: '$', name: 'Dólares' }
  ];

  const rubroOptions = [
    "Almuerzo",
    "Cena",
    "Combustible",
    "Desayuno",
    "Hidratación",
    "Hospedaje",
    "Materiales",
    "Peaje",
    "Uber",
    "Parqueo",
    "Versatec",
    "Transporte público"
  ];

  const allWorkers = React.useMemo(() => {
    return departmentWorkers
      .reduce((acc, dept) => {
        dept.workers.forEach((worker) => {
          if (
            worker.empleado &&
            !acc.some((p) => p.id === worker.empleado.id) &&
            worker.empleado.email !== user?.username
          ) {
            acc.push({
              id: worker.empleado.id,
              displayName: worker.empleado.displayName,
              email: worker.empleado.email,
            });
          }
        });
        return acc;
      }, [])
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [departmentWorkers, user?.username]);

  // Load expense data when component mounts
  useEffect(() => {
    if (!contextLoading) {
      const expense = expenseReports.find((exp) => exp.id === id);
      if (!expense) {
        navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.LIST);
        return;
      }

      // Check if user can edit this expense
      const canEdit = () => {
        if (!permissionService || !expense || !user) return false;

        // Administrators can edit
        if (permissionService.hasRole(user.username, "Jefe") ||
          permissionService.hasRole(user.username, "Asistente")) {
          return true;
        }

        // Creator can edit if not locked
        return user.username === expense.createdBy.email && !expense.bloqueoEdicion;
      };

      if (!canEdit()) {
        navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(id));
        return;
      }

      // Format date to YYYY-MM-DD for input
      const formattedDate = expense.fecha.toISOString().split("T")[0];

      // Set form data with new fields
      setFormData({
        rubro: expense.rubro,
        monto: expense.monto,
        currencySymbol: expense.currencySymbol,
        fecha: formattedDate,
        st: expense.st,
        dias: expense.dias || "", // Campo días
        fondosPropios: expense.fondosPropios || false,
        facturaSolitario: expense.facturaSolitario || false, // Nuevo campo
        facturaDividida: expense.facturaDividida || false,
        motivo: expense.motivo || "",
        comprobante: expense.comprobante,
        integrantes: expense.integrantes || "",
        notas: expense.notas || "",
        IntegrantesV2: expense.IntegrantesV2?.map(integrante => ({
          id: integrante.id,
          displayName: integrante.displayName,
          email: integrante.email
        })) || []
      });

      // Set preview if there's a comprobante
      if (expense.comprobante) {
        setPreview(expense.comprobante);
        setIsNewFile(false);
      }
    }
  }, [id, expenseReports, navigate, contextLoading, user, permissionService]);

  const handleCancel = () => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(id), {
      state: { from: location.state?.from },
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTipoFacturaChange = (tipo) => {
    setFormData((prev) => ({
      ...prev,
      // Resetear todos los tipos
      fondosPropios: false,
      facturaSolitario: false,
      facturaDividida: false,
      // Activar solo el seleccionado
      [tipo]: true,
      // Limpiar campos relacionados cuando cambia el tipo
      IntegrantesV2: tipo === "facturaDividida" ? prev.IntegrantesV2 : [],
      motivo: tipo === "fondosPropios" ? prev.motivo : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.rubro ||
        !formData.monto ||
        !formData.fecha ||
        !formData.st
      ) {
        throw new Error("Por favor complete todos los campos requeridos");
      }

      // Validate días for Hospedaje
      if (formData.rubro === "Hospedaje" && (!formData.dias || formData.dias <= 0)) {
        throw new Error("Para hospedaje debe ingresar el número de días");
      }

      // Validate tipo de factura
      if (!formData.fondosPropios && !formData.facturaSolitario && !formData.facturaDividida) {
        throw new Error("Debe seleccionar el tipo de factura (fondos propios, factura en solitario o factura dividida)");
      }

      // Validate motivo for fondos propios
      if (formData.fondosPropios && !formData.motivo.trim()) {
        throw new Error("Debe ingresar el motivo para fondos propios");
      }

      // Validate integrantes for factura dividida
      if (formData.facturaDividida && formData.IntegrantesV2.length === 0) {
        throw new Error("Debe seleccionar al menos un integrante para factura dividida");
      }

      if (!formData.comprobante && !isNewFile) {
        throw new Error("Debe adjuntar un comprobante");
      }

      // Prepare expense data
      const expenseData = {
        ...formData,
        // Incluir días si es hospedaje
        dias: formData.rubro === "Hospedaje" ? parseFloat(formData.dias) : null,
        integrantes: formData.IntegrantesV2
          .map(user => user.displayName)
          .join(", "),
      };

      // Update expense in SharePoint
      const updatedExpense = await service.updateExpenseReport(
        id,
        expenseData,
        isNewFile ? formData.comprobante : undefined
      );

      // Update contributors (only if factura dividida)
      if (formData.facturaDividida) {
        await service.updateExpenseIntegrantes(
          id,
          formData.IntegrantesV2.map(user => user.id)
        );
      } else {
        // Clear contributors if not factura dividida
        await service.updateExpenseIntegrantes(id, []);
      }

      // Update state with new data
      setExpenseReports((prevReports) =>
        prevReports.map((report) =>
          report.id === id
            ? {
              ...report,
              rubro: updatedExpense.fields.Rubro,
              monto: parseFloat(updatedExpense.fields.Monto),
              currencySymbol: updatedExpense.fields.CurrencySymbol,
              fecha: new Date(updatedExpense.fields.Fecha),
              st: updatedExpense.fields.ST,
              dias: updatedExpense.fields.Dias || null, // Actualizar días
              fondosPropios: Boolean(updatedExpense.fields.Fondospropios),
              facturaSolitario: Boolean(updatedExpense.fields.FacturaSolitario), // Actualizar factura solitario
              motivo: updatedExpense.fields.Title || "",
              comprobante: updatedExpense.fields.Comprobante,
              facturaDividida: Boolean(updatedExpense.fields.FacturaDividida),
              integrantes: updatedExpense.fields.Integrantes || "",
              bloqueoEdicion: Boolean(
                updatedExpense.fields.Bloqueoedici_x00f3_n
              ),
              aprobacionAsistente:
                updatedExpense.fields.Aprobaci_x00f3_nAsistente ||
                report.aprobacionAsistente,
              aprobacionJefatura:
                updatedExpense.fields.Aprobaci_x00f3_nJefatura ||
                report.aprobacionJefatura,
              aprobacionContabilidad:
                updatedExpense.fields.Aprobaci_x00f3_nContabilidad ||
                report.aprobacionContabilidad,
              createdBy: report.createdBy,
              notas: updatedExpense.fields.Notas,
              // Keep IntegrantesV2 in sync
              IntegrantesV2: formData.facturaDividida ? formData.IntegrantesV2 : []
            }
            : report
        )
      );

      // Navigate to detail view
      navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(id), {
        state: { from: location.state?.from },
      });
    } catch (err) {
      console.error("Error updating expense:", err);
      setError(
        err.message ||
        "Error al actualizar el gasto. Por favor intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while waiting for data
  if (!formData || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Editar Gasto">
        {error && (
          <div className="mb-6 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex gap-4">
                {/* Campo Rubro */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rubro *
                  </label>
                  <select
                    name="rubro"
                    value={formData.rubro}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  >
                    <option value="">Seleccione un rubro</option>
                    {rubroOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo Días - Solo visible si rubro es "Hospedaje" */}
                {formData.rubro === "Hospedaje" && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días *
                    </label>
                    <input
                      type="number"
                      name="dias"
                      value={formData.dias}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      required
                      className="w-full pl-3 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                      placeholder="Ej: 2"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monto *
              </label>
              <div className="flex items-center space-x-2">
                <select
                  key="currencySymbol"
                  name="currencySymbol"
                  value={formData.currencySymbol}
                  onChange={handleInputChange}
                  className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                >
                  {currencies.map((curr) => (
                    <option key={curr.name} value={curr.symbol}>
                      {curr.symbol}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-3 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fecha *
              </label>
              <input
                type="date"
                name="fecha"
                value={formData?.fecha || ""}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ST *
              </label>
              <input
                type="text"
                name="st"
                value={formData.st}
                onChange={handleInputChange}
                required
                pattern="^\d{4}-\d{4}$"
                placeholder="0000-0000"
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Tipo de Factura - Obligatorio seleccionar uno */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Tipo de Factura * (Seleccione una opción)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fondosPropios"
                    name="tipoFactura"
                    value="fondosPropios"
                    checked={formData.fondosPropios}
                    onChange={(e) => handleTipoFacturaChange(e.target.value)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="fondosPropios"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Fondos propios
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="facturaSolitario"
                    name="tipoFactura"
                    value="facturaSolitario"
                    checked={formData.facturaSolitario}
                    onChange={(e) => handleTipoFacturaChange(e.target.value)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="facturaSolitario"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Factura en solitario
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="facturaDividida"
                    name="tipoFactura"
                    value="facturaDividida"
                    checked={formData.facturaDividida}
                    onChange={(e) => handleTipoFacturaChange(e.target.value)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="facturaDividida"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Factura dividida entre varios integrantes
                  </label>
                </div>
              </div>
            </div>

            {/* Campo Motivo - Solo visible si es fondos propios */}
            {formData.fondosPropios && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Motivo *
                </label>
                <input
                  type="text"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingrese el motivo"
                  className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            )}

            {/* Selección de integrantes - Solo visible si es factura dividida */}
            {formData.facturaDividida && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Integrantes adicionales *
                </label>
                <MultiSelect
                  options={allWorkers}
                  value={formData.IntegrantesV2}
                  onChange={(selected) => setFormData(prev => ({
                    ...prev,
                    IntegrantesV2: selected
                  }))}
                  placeholder="Seleccionar integrantes..."
                  searchPlaceholder="Buscar por nombre o correo..."
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="notas"
              className="block text-sm font-medium text-gray-700"
            >
              Notas adicionales
            </label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              placeholder="Ingrese notas adicionales sobre el gasto"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comprobante/Factura *
            </label>
            <CameraUpload
              onImageCapture={(file) => {
                setFormData((prev) => ({
                  ...prev,
                  comprobante: file,
                }));
                setIsNewFile(Boolean(file));
              }}
              onError={(errorMessage) => setError(errorMessage)}
              previewItemId={!isNewFile ? preview : null}
              service={service}
              siteId={service.siteId}
              driveId={service.driveId}
              loading={loading}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              startIcon={
                loading ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )
              }
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ExpenseEdit;
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import CameraUpload from "../../../../components/common/CameraUpload";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { useAuth } from "../../../../components/AuthProvider";

const ExpenseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const {
    expenseReports,
    setExpenseReports,
    service,
    loading: contextLoading,
    userDepartmentRole
  } = useExpenseAudit();
  const [formData, setFormData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isNewFile, setIsNewFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageRemoved] = useState(false);

  const rubroOptions = [
    "Almuerzo",
    "Cena",
    "Combustible",
    "Desayuno",
    "Hidratación",
    "Hospedaje",
    "Materiales",
    "Peaje",
    "Habitación",
    "Uber",
    "Parqueo",
    "Versatec",
    "Transporte público"
  ];

  useEffect(() => {
    if (!contextLoading) {
      const expense = expenseReports.find((exp) => exp.id === id);
      if (!expense) {
        navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.LIST);
        return;
      }

      const canEdit = () => {
        if (!userDepartmentRole || !expense || !user) return false;
        
        if (userDepartmentRole.role === "Jefe" || userDepartmentRole.role === "Asistente") {
          return true;
        }

        return user.username === expense.createdBy.email && !expense.bloqueoEdicion;
      };

      if (!canEdit()) {
        navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(id));
        return;
      }

      const formattedDate = expense.fecha.toISOString().split("T")[0];
      setFormData({
        rubro: expense.rubro,
        monto: expense.monto,
        fecha: formattedDate,
        st: expense.st,
        fondosPropios: expense.fondosPropios,
        motivo: expense.motivo || "",
        comprobante: expense.comprobante,
        facturaDividida: expense.facturaDividida || false,
        integrantes: expense.integrantes || "",
        notas: expense.notas || ""
      });

      if (expense.comprobante) {
        setPreview(expense.comprobante);
        setIsNewFile(false);
      }
    }
  }, [id, expenseReports, navigate, contextLoading, user, userDepartmentRole]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !formData.rubro ||
        !formData.monto ||
        !formData.fecha ||
        !formData.st
      ) {
        throw new Error("Por favor complete todos los campos requeridos");
      }

      // Check if there's no image (neither existing nor new)
      if (!formData.comprobante && !isNewFile) {
        throw new Error("Debe adjuntar un comprobante");
      }

      const expenseData = {
        ...formData,
      };

      // Only pass the new file if one was uploaded or if image was explicitly removed
      const fileToUpload = isNewFile
        ? formData.comprobante
        : imageRemoved
          ? null
          : undefined;

      const updatedExpense = await service.updateExpenseReport(
        id,
        expenseData,
        fileToUpload
      );

      setExpenseReports((prevReports) =>
        prevReports.map((report) =>
          report.id === id
            ? {
              ...report,
              rubro: updatedExpense.fields.Rubro,
              monto: parseFloat(updatedExpense.fields.Monto),
              fecha: new Date(updatedExpense.fields.Fecha),
              st: updatedExpense.fields.ST,
              fondosPropios: Boolean(updatedExpense.fields.Fondospropios),
              motivo: updatedExpense.fields.Title || "",
              comprobante: updatedExpense.fields.Comprobante,
              facturaDividida: Boolean(updatedExpense.fields.FacturaDividida),
              integrantes: updatedExpense.fields.Integrantes || "",
              bloqueoEdicion: Boolean(
                updatedExpense.fields.Bloqueoedici_x00f3_n
              ),
              aprobacionAsistente:
                updatedExpense.fields.Aprobaci_x00f3_n_x0020_Departame ||
                report.aprobacionAsistente,
              aprobacionJefatura:
                updatedExpense.fields.Aprobaci_x00f3_n_x0020_Jefatura ||
                report.aprobacionJefatura,
              aprobacionContabilidad:
                updatedExpense.fields.Aprobaci_x00f3_n_x0020_Contabili ||
                report.aprobacionContabilidad,
              createdBy: report.createdBy,
              notas: updatedExpense.fields.Notas,
            }
            : report
        )
      );

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
              <label className="block text-sm font-medium text-gray-700">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₡
                </span>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-8 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="fondosPropios"
              name="fondosPropios"
              checked={formData.fondosPropios}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="fondosPropios"
              className="ml-2 text-sm text-gray-700"
            >
              Fondos propios
            </label>
          </div>

          {formData.fondosPropios && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Motivo
              </label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo || ""}
                onChange={handleInputChange}
                placeholder="Ingrese el motivo"
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="facturaDividida"
              name="facturaDividida"
              checked={formData.facturaDividida}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="facturaDividida"
              className="ml-2 text-sm text-gray-700"
            >
              ¿La factura es dividida entre varios integrantes?
            </label>
          </div>

          {formData.facturaDividida && (
            <div className="space-y-2">
              <label
                htmlFor="integrantes"
                className="block text-sm font-medium text-gray-700"
              >
                Integrantes
              </label>
              <input
                type="text"
                id="integrantes"
                name="integrantes"
                value={formData.integrantes || ""}
                onChange={handleInputChange}
                placeholder="Ingrese los nombres de los integrantes"
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          )}

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

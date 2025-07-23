import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import CameraUpload from "../../../../components/common/CameraUpload";
import MultiSelect from "../../../../components/common/MultiSelect";
import { useAuth } from "../../../../components/AuthProvider";

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { service, setExpenseReports, departmentWorkers } = useExpenseAudit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const currencies = [
    { code: 'CRC', symbol: '₡', name: 'Colones' },
    { code: 'USD', symbol: '$', name: 'Dólares' }
  ];

  const [formData, setFormData] = useState({
    rubro: "",
    monto: "",
    currencySymbol: '₡',
    fecha: "",
    st: "",
    dias: "", // Agregado para hospedaje
    fondosPropios: false,
    facturaSolitario: false,
    facturaDividida: false,
    motivo: "",
    comprobante: null,
    integrantes: "",
    notas: "",
    IntegrantesV2: [],
  });

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

  // Get potential contributors (people who can share expenses with current user)
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

      if (!formData.comprobante) {
        throw new Error("Debe adjuntar un comprobante");
      }

      // Prepare expense data
      const expenseData = {
        ...formData,
        // Los campos booleanos ya están correctos en formData
        // Incluir días si es hospedaje
        dias: formData.rubro === "Hospedaje" ? parseFloat(formData.dias) : null,
        integrantes: formData.IntegrantesV2
          .map(user => user.displayName)
          .join(", "),
      };

      // Create expense in SharePoint
      const newExpense = await service.createExpenseReport(
        expenseData,
        formData.comprobante
      );

      if (newExpense.id) {
        // Update contributors (if any)
        if (formData.facturaDividida) {
          await service.updateExpenseIntegrantes(
            newExpense.id,
            formData.IntegrantesV2.map(user => user.id)
          );
        }
      }

      // Format the new expense for state update
      const formattedExpense = {
        id: newExpense.id,
        rubro: newExpense.fields.Rubro,
        comprobante: newExpense.fields.Comprobante,
        fecha: new Date(newExpense.fields.Fecha),
        monto: parseFloat(newExpense.fields.Monto),
        currencySymbol: newExpense.fields.CurrencySymbol || "₡",
        st: newExpense.fields.ST,
        dias: parseInt(newExpense.fields.Dias) || 0,
        fondosPropios: Boolean(newExpense.fields.Fondospropios),
        facturaSolitario: Boolean(newExpense.fields.FacturaSolitario),
        motivo: newExpense.fields.Title,
        notasRevision: newExpense.fields.Notasrevision || "",
        bloqueoEdicion: false,
        aprobacionAsistente: newExpense.fields.Aprobaci_x00f3_nAsistente || "Pendiente",
        aprobacionJefatura: newExpense.fields.Aprobaci_x00f3_nJefatura || "Pendiente",
        aprobacionContabilidad: newExpense.fields.Aprobaci_x00f3_nContabilidad || "Pendiente",
        facturaDividida: Boolean(newExpense.fields.FacturaDividida),
        integrantes: newExpense.fields.Integrantes || "",
        createdBy: {
          name: newExpense.createdBy.user.displayName,
          email: newExpense.createdBy.user.email,
          id: newExpense.createdBy.user.id,
        },
        notas: newExpense.fields.Notas,
      };

      // Update application state
      setExpenseReports((prevReports) => [formattedExpense, ...prevReports]);

      // Navigate to expense list
      navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.LIST);
    } catch (err) {
      console.error("Error creating expense:", err);
      setError(
        err.message || "Error al crear el gasto. Por favor intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Nuevo Gasto">
        {error && (
          <div className="mb-4 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
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
                  <label
                    htmlFor="rubro"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Rubro *
                  </label>
                  <select
                    id="rubro"
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
                    <label
                      htmlFor="dias"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Días *
                    </label>
                    <input
                      type="number"
                      id="dias"
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
              <label
                htmlFor="monto"
                className="block text-sm font-medium text-gray-700"
              >
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
                  id="monto"
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
              <label
                htmlFor="fecha"
                className="block text-sm font-medium text-gray-700"
              >
                Fecha * (últimas 2 semanas)
              </label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="st"
                className="block text-sm font-medium text-gray-700"
              >
                ST *
              </label>
              <input
                type="text"
                id="st"
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
                <label
                  htmlFor="motivo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Motivo *
                </label>
                <input
                  type="text"
                  id="motivo"
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
              }}
              onError={(errorMessage) => setError(errorMessage)}
              loading={loading}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.LIST)}
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

export default ExpenseForm;
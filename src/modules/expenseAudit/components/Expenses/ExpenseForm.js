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
    fondosPropios: false,
    motivo: "",
    comprobante: null,
    facturaDividida: false,
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

      if (!formData.comprobante) {
        throw new Error("Debe adjuntar un comprobante");
      }



     


      // Prepare expense data
      const expenseData = {
        ...formData,
        facturaDividida: formData.facturaDividida || false,
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
        await service.updateExpenseIntegrantes(
          newExpense.id,
          formData.IntegrantesV2.map(user => user.id)
        );

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
        fondosPropios: Boolean(newExpense.fields.Fondospropios),
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
              <label
                htmlFor="rubro"
                className="block text-sm font-medium text-gray-700"
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
                    <option  key= {curr.name} value={curr.symbol}>
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
                  className="w-full pl-4 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
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
          <div className="flex flex-col gap-4">
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
                <label
                  htmlFor="motivo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Motivo
                </label>
                <input
                  type="text"
                  id="motivo"
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
          </div>
          {formData.facturaDividida && (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
              >
                Integrantes adicionales
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
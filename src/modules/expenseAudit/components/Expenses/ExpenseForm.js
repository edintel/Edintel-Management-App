import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import { Upload, Save, X, Loader } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from '../../routes';
import {
  optimizeImage,
  validateImage,
  getFileSizeMB,
} from "../utils/imageUtils";

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { service, setExpenseReports } = useExpenseAudit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [formData, setFormData] = useState({
    rubro: "",
    monto: "",
    fecha: "",
    st: "",
    fondosPropios: false,
    motivo: "",
    comprobante: null,
    facturaDividida: false,
    integrantes: "",
  });
  const [preview, setPreview] = useState(null);

  const dateLimits = useMemo(() => {
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);

    return {
      max: today.toISOString().split("T")[0],
      min: twoWeeksAgo.toISOString().split("T")[0],

      displayMax: today.toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      displayMin: twoWeeksAgo.toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  }, []);

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
    "Versatec",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImage(file);

      setLoading(true);
      setError(null);

      const originalSize = getFileSizeMB(file);

      const optimizedFile = await optimizeImage(file);
      const optimizedSize = getFileSizeMB(optimizedFile);

      setFormData((prev) => ({ ...prev, comprobante: optimizedFile }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setImageInfo({
          originalSize,
          optimizedSize,
          name: file.name,
        });
      };
      reader.readAsDataURL(optimizedFile);
    } catch (err) {
      setError(err.message || "Error al procesar la imagen");
    } finally {
      setLoading(false);
    }
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

      if (!formData.comprobante) {
        throw new Error("Debe adjuntar un comprobante");
      }

      const selectedDate = new Date(formData.fecha);
      const minDate = new Date(dateLimits.min);
      const maxDate = new Date(dateLimits.max);

      if (selectedDate < minDate || selectedDate > maxDate) {
        throw new Error(
          "La fecha debe estar entre las últimas 2 semanas y hoy"
        );
      }

      const expenseDataWithPeriod = {
        ...formData,
      };

      const newExpense = await service.createExpenseReport(
        expenseDataWithPeriod,
        formData.comprobante
      );

      const formattedExpense = {
        id: newExpense.id,
        rubro: newExpense.fields.Rubro,
        comprobante: newExpense.fields.Comprobante,
        fecha: new Date(newExpense.fields.Fecha),
        monto: parseFloat(newExpense.fields.Monto),
        st: newExpense.fields.ST,
        periodoId: newExpense.fields.PeriodoIDLookupId,
        fondosPropios: Boolean(newExpense.fields.Fondospropios),
        motivo: newExpense.fields.Title,
        notasRevision: newExpense.fields.Notasrevision || "",
        bloqueoEdicion: false,
        aprobacionAsistente: "Pendiente",
        aprobacionJefatura: "Pendiente",
        aprobacionContabilidad: "Pendiente",
        createdBy: {
          name: newExpense.createdBy.user.displayName,
          email: newExpense.createdBy.user.email,
          id: newExpense.createdBy.user.id,
        },
      };

      setExpenseReports((prevReports) => [formattedExpense, ...prevReports]);
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
            <div className="mb-4 p-4 bg-error/10 text-error rounded-lg">
              {error}
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₡
                  </span>
                  <input
                    type="number"
                    id="monto"
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
                  min={dateLimits.min}
                  max={dateLimits.max}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
                <div className="text-sm">
                  <p className="text-gray-500">
                    Rango permitido: {dateLimits.displayMin} -{" "}
                    {dateLimits.displayMax}
                  </p>
                </div>
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
              <label className="block text-sm font-medium text-gray-700">
                Comprobante/Factura *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
                {preview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-xs rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg hover:bg-error/90 transition-colors"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            comprobante: null,
                          }));
                          setPreview(null);
                          setImageInfo(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {imageInfo && (
                      <div className="text-sm text-gray-500">
                        <p>Archivo: {imageInfo.name}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex flex-col items-center">
                      {loading ? (
                        <Loader
                          size={24}
                          className="text-gray-400 mb-2 animate-spin"
                        />
                      ) : (
                        <Upload size={24} className="text-gray-400 mb-2" />
                      )}
                      <span className="text-sm text-gray-500">
                        {loading
                          ? "Procesando imagen..."
                          : "Click para subir o arrastrar archivo"}
                      </span>
                    </div>
                    <input
                      type="file"
                      name="comprobante"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={loading}
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Upload comprobante"
                    />
                  </div>
                )}
              </div>
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

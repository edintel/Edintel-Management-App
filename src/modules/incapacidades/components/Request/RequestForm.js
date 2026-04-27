import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useIncapacidades } from '../../context/incapacidadesContext';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { ArrowLeft, Upload, X, Image, Loader2, AlertTriangle } from 'lucide-react';
import { INCAPACIDADES_ROUTES } from '../../routes';

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const RequestForm = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const { createRequest, service } = useIncapacidades();

  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewFiles, setPreviewFiles] = useState([]);

  const userEmail = accounts[0]?.username || '';

  const [form, setForm] = useState({
    nombreSolicitante: accounts[0]?.name || '',
    numeroCedula: '',
    departamento: '',
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
  });

  const dias = calculateDays(form.fechaInicio, form.fechaFin);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleFiles = e => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    const withPreviews = valid.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
    }));
    setPreviewFiles(prev => [...prev, ...withPreviews]);
    e.target.value = '';
  };

  const removeFile = idx => {
    setPreviewFiles(prev => {
      const next = [...prev];
      if (next[idx].preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.fechaInicio || !form.fechaFin) {
      setError('Las fechas de inicio y fin son requeridas.');
      return;
    }
    if (new Date(form.fechaFin) < new Date(form.fechaInicio)) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    if (!form.departamento.trim()) {
      setError('El departamento es requerido.');
      return;
    }
    if (previewFiles.length === 0) {
      setError('Debe subir al menos una foto del comprobante.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createRequest(
        { ...form, diasIncapacidad: dias },
        previewFiles.map(pf => pf.file)
      );
      navigate(INCAPACIDADES_ROUTES.MY_REQUESTS);
    } catch (err) {
      console.error(err);
      setError('Error al enviar la solicitud. Intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(INCAPACIDADES_ROUTES.DASHBOARD)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Volver al dashboard</span>
      </button>

      <Card>
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Nueva Incapacidad</h1>

          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del solicitante</label>
              <input
                name="nombreSolicitante"
                value={form.nombreSolicitante}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Cédula + Departamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de cédula</label>
                <input
                  name="numeroCedula"
                  value={form.numeroCedula}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento <span className="text-red-500">*</span></label>
                <input
                  name="departamento"
                  value={form.departamento}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={form.fechaInicio}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="fechaFin"
                  value={form.fechaFin}
                  onChange={handleChange}
                  required
                  min={form.fechaInicio}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Días calculados */}
            {dias > 0 && (
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
                <strong>{dias} día(s) hábil(es)</strong> de incapacidad
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico / Motivo</label>
              <textarea
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Ej: Fractura, gripe, cirugía..."
              />
            </div>

            {/* Comprobante upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante médico <span className="text-red-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-primary rounded-lg px-4 py-3 w-full text-sm text-gray-600 hover:text-primary transition-colors"
              >
                <Upload size={18} />
                <span>Agregar fotos o PDF del comprobante</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={handleFiles}
              />

              {previewFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {previewFiles.map((pf, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      {pf.preview ? (
                        <img src={pf.preview} alt={pf.name} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex flex-col items-center justify-center text-gray-400">
                          <Image size={24} />
                          <span className="text-xs mt-1 px-1 text-center truncate w-full">{pf.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => navigate(INCAPACIDADES_ROUTES.DASHBOARD)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Enviando...</span>
                ) : 'Enviar incapacidad'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default RequestForm;

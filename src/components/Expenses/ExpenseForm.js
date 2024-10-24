// src/components/Expenses/ExpenseForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import { Upload, Save, X } from 'lucide-react';
import './ExpenseForm.css';

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { periods } = useAppContext();
  const [formData, setFormData] = useState({
    rubro: '',
    monto: '',
    fecha: '',
    st: '',
    fondosPropios: false,
    comprobante: null
  });
  const [preview, setPreview] = useState(null);

  const rubroOptions = [
    'Almuerzo',
    'Cena',
    'Combustible',
    'Desayuno',
    'Hidratación',
    'Hospedaje',
    'Materiales',
    'Peaje',
    'Habitación',
    'Uber',
    'Versatec'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, comprobante: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit logic will be implemented later
    navigate('/expenses');
  };

  return (
    <Layout>
      <div className="expense-form-container">
        <Card title="Nuevo Gasto" className="expense-form-card">
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="rubro">Rubro *</label>
                <select
                  id="rubro"
                  name="rubro"
                  value={formData.rubro}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione un rubro</option>
                  {rubroOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="monto">Monto *</label>
                <div className="input-prefix">
                  <span>₡</span>
                  <input
                    type="number"
                    id="monto"
                    name="monto"
                    value={formData.monto}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="st">ST *</label>
                <input
                  type="text"
                  id="st"
                  name="st"
                  value={formData.st}
                  onChange={handleInputChange}
                  required
                  pattern="^\d{4}-\d{4}$"
                  placeholder="0000-0000"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="fondosPropios"
                  checked={formData.fondosPropios}
                  onChange={handleInputChange}
                />
                Fondos propios
              </label>
            </div>

            {formData.fondosPropios && (
              <div className="form-group">
                <label htmlFor="motivo">Motivo</label>
                <input
                  type="text"
                  id="motivo"
                  name="motivo"
                  value={formData.motivo || ''}
                  onChange={handleInputChange}
                  placeholder="Ingrese el motivo"
                />
              </div>
            )}

            <div className="form-group file-upload">
              <label>Comprobante/Factura *</label>
              <div className="file-upload-area">
                {preview ? (
                  <div className="file-preview">
                    <img src={preview} alt="Preview" />
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, comprobante: null }));
                        setPreview(null);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={24} />
                    <span>Click para subir o arrastrar archivo</span>
                    <input
                      type="file"
                      name="comprobante"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/expenses')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                startIcon={<Save size={16} />}
              >
                Guardar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default ExpenseForm;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncapacidades } from '../../context/incapacidadesContext';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { Plus, Search, CheckCircle, Clock, Eye, Loader2 } from 'lucide-react';
import { INCAPACIDADES_ROUTES } from '../../routes';

const RequestList = ({ showAll = false }) => {
  const navigate = useNavigate();
  const { requests, loading, userRole } = useIncapacidades();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | recibido

  const filtered = requests.filter(r => {
    const matchSearch =
      !search ||
      r.nombreSolicitante?.toLowerCase().includes(search.toLowerCase()) ||
      r.departamento?.toLowerCase().includes(search.toLowerCase()) ||
      r.motivo?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && r.recibido !== true) ||
      (filter === 'recibido' && r.recibido === true);

    return matchSearch && matchFilter;
  });

  const fmtDate = iso => {
    if (!iso) return '-';
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-CR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {showAll && userRole === 'Administrador' ? 'Todas las incapacidades' : 'Mis incapacidades'}
        </h1>
        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={() => navigate(INCAPACIDADES_ROUTES.NEW_REQUEST)}
        >
          Nueva
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, departamento o motivo..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes de recibir</option>
            <option value="recibido">Recibidas</option>
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-gray-500">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No se encontraron incapacidades.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.recibido === true
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.recibido === true
                        ? <><CheckCircle size={11} /> Recibida</>
                        : <><Clock size={11} /> Pendiente</>}
                    </span>
                    <span className="text-xs text-gray-400">{r.diasIncapacidad} día(s)</span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{r.nombreSolicitante}</p>
                  <p className="text-sm text-gray-500">
                    {r.departamento} · {fmtDate(r.fechaInicio)} al {fmtDate(r.fechaFin)}
                  </p>
                  {r.motivo && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{r.motivo}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="large"
                  startIcon={<Eye size={14} />}
                  onClick={() => navigate(`${INCAPACIDADES_ROUTES.DETAIL_BASE}/${r.id}`)}
                >
                  Ver
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestList;

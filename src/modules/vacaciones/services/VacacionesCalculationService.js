// Feriados fijos de Costa Rica
const FERIADOS_FIJOS = [
  { mes: 1, dia: 1 },
  { mes: 4, dia: 11 },
  { mes: 5, dia: 1 },
  { mes: 7, dia: 25 },
  { mes: 8, dia: 2 },
  { mes: 8, dia: 15 },
  { mes: 8, dia: 31 },
  { mes: 9, dia: 15 },
  { mes: 12, dia: 1 },
  { mes: 12, dia: 25 },
];

export const calcularPascua = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

export const esFeriado = (fecha) => {
  const date = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
  const mes = date.getMonth() + 1;
  const dia = date.getDate();
  const year = date.getFullYear();

  const esFeriadoFijo = FERIADOS_FIJOS.some(f => f.mes === mes && f.dia === dia);
  if (esFeriadoFijo) return true;

  const pascua = calcularPascua(year);
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);

  const fechaStr = date.toDateString();
  return fechaStr === juevesSanto.toDateString() || fechaStr === viernesSanto.toDateString();
};

export const esFinDeSemana = (fecha) => {
  const date = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
  const dia = date.getDay();
  return dia === 0 || dia === 6; // Domingo o Sábado
};

export const esDiaHabil = (fecha) => {
  return !esFinDeSemana(fecha) && !esFeriado(fecha);
};

export const calcularDiasHabiles = (fechaInicio, fechaFin) => {
  const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio + 'T00:00:00') : new Date(fechaInicio);
  const fin = typeof fechaFin === 'string' ? new Date(fechaFin + 'T00:00:00') : new Date(fechaFin);

  let dias = 0;
  const current = new Date(inicio);

  while (current <= fin) {
    if (esDiaHabil(current)) {
      dias++;
    }
    current.setDate(current.getDate() + 1);
  }

  return dias;
};

// Verifica si la fecha de inicio tiene al menos 2 días de antelación
export const validarAntelacion = (fechaInicio) => {
  if (!fechaInicio) return { valid: false, message: 'Fecha de inicio requerida' };

  const inicio = new Date(fechaInicio + 'T00:00:00');
  inicio.setHours(0, 0, 0, 0);

  const minFecha = new Date();
  minFecha.setHours(0, 0, 0, 0);
  minFecha.setDate(minFecha.getDate() + 2);

  if (inicio < minFecha) {
    return {
      valid: false,
      message: `Las vacaciones deben solicitarse con al menos 2 días de antelación. La fecha mínima es ${minFecha.toLocaleDateString('es-CR')}`
    };
  }

  return { valid: true };
};

export const validarFechaVacacion = (fecha, label = 'La fecha') => {
  if (!fecha) return { valid: false, message: `${label} es requerida` };

  if (esFinDeSemana(fecha)) {
    return { valid: false, message: `${label} no puede ser fin de semana (sábado o domingo)` };
  }

  if (esFeriado(fecha)) {
    return { valid: false, message: `${label} no puede ser un día feriado` };
  }

  return { valid: true };
};

export const validarRangoVacaciones = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) {
    return { valid: false, message: 'Debe seleccionar fecha de inicio y fin' };
  }

  const validInicio = validarFechaVacacion(fechaInicio, 'La fecha de inicio');
  if (!validInicio.valid) return validInicio;

  const validFin = validarFechaVacacion(fechaFin, 'La fecha de fin');
  if (!validFin.valid) return validFin;

  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T00:00:00');

  if (fin < inicio) {
    return { valid: false, message: 'La fecha de fin no puede ser anterior a la fecha de inicio' };
  }

  const validAntelacion = validarAntelacion(fechaInicio);
  if (!validAntelacion.valid) return validAntelacion;

  const dias = calcularDiasHabiles(fechaInicio, fechaFin);
  if (dias === 0) {
    return { valid: false, message: 'El rango seleccionado no contiene días hábiles' };
  }

  return { valid: true, diasHabiles: dias };
};

export const obtenerFechaMinima = () => {
  const minFecha = new Date();
  minFecha.setDate(minFecha.getDate() + 2);
  return minFecha.toISOString().split('T')[0];
};

export default {
  esFeriado,
  esFinDeSemana,
  esDiaHabil,
  calcularDiasHabiles,
  validarAntelacion,
  validarFechaVacacion,
  validarRangoVacaciones,
  obtenerFechaMinima,
};

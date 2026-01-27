// src/modules/extraHours/services/ExtraHoursCalculationService.js

/**
 * Servicio centralizado para cálculos de horas extras
 * Incluye: feriados, cálculos de horas, validaciones, períodos de bloqueo
 */

// ============================================
// CONSTANTES
// ============================================

/**
 * Feriados fijos de Costa Rica
 */
const FERIADOS_FIJOS = [
  { mes: 1, dia: 1 },    // 1 enero - Año Nuevo
  { mes: 4, dia: 11 },   // 11 abril - Juan Santamaría
  { mes: 5, dia: 1 },    // 1 mayo - Día del Trabajo
  { mes: 7, dia: 25 },   // 25 julio - Anexión Guanacaste
  { mes: 8, dia: 2 },    // 2 agosto - Virgen de los Ángeles
  { mes: 8, dia: 15 },   // 15 agosto - Día de la Madre
  { mes: 8, dia: 31 },   // 31 agosto - Día de la Persona Negra
  { mes: 9, dia: 15 },   // 15 septiembre - Independencia
  { mes: 12, dia: 1 },   // 1 diciembre - Abolición del Ejército
  { mes: 12, dia: 25 },  // 25 diciembre - Navidad
];

/**
 * Horarios de trabajo
 */
const HORARIOS = {
  LABORAL_INICIO: 7 * 60 + 30, // 7:30 AM en minutos
  LABORAL_FIN: 17 * 60,         // 5:00 PM en minutos
  DIURNO_INICIO: 6,             // 6:00 AM
  DIURNO_FIN: 22,               // 10:00 PM
  NOCTURNO_INICIO: 22,          // 10:00 PM
  NOCTURNO_FIN: 6,              // 6:00 AM (del día siguiente)
};

/**
 * Períodos de bloqueo (días del mes)
 */
const PERIODOS_BLOQUEO = {
  PRIMER_PERIODO: { inicio: 9, fin: 14 },  // Antes del día 15
  SEGUNDO_PERIODO: { inicio: 24, fin: 29 }, // Antes del día 30
};

// ============================================
// FUNCIONES DE FERIADOS
// ============================================

/**
 * Calcula la fecha de Pascua usando el algoritmo de Computus
 * @param {number} year - Año para calcular la Pascua
 * @returns {Date} Fecha de Pascua
 */
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

/**
 * Verifica si una fecha es feriado en Costa Rica
 * @param {Date|string} fecha - Fecha a verificar (Date o string "YYYY-MM-DD")
 * @returns {boolean} True si es feriado
 */
export const esFeriado = (fecha) => {
  const date = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
  const mes = date.getMonth() + 1;
  const dia = date.getDate();
  const year = date.getFullYear();

  // Verificar feriados fijos
  const esFeriadoFijo = FERIADOS_FIJOS.some(
    feriado => feriado.mes === mes && feriado.dia === dia
  );

  if (esFeriadoFijo) return true;

  // Calcular Semana Santa (Jueves y Viernes Santo)
  const pascua = calcularPascua(year);
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);

  const fechaStr = date.toDateString();
  return (
    fechaStr === juevesSanto.toDateString() ||
    fechaStr === viernesSanto.toDateString()
  );
};

/**
 * Verifica si una fecha es domingo
 * @param {Date|string} fecha - Fecha a verificar
 * @returns {boolean} True si es domingo
 */
export const esDomingo = (fecha) => {
  const date = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
  return date.getDay() === 0;
};

/**
 * Obtiene información sobre un feriado específico
 * @param {Date|string} fecha - Fecha a verificar
 * @returns {Object|null} Información del feriado o null si no es feriado
 */
export const getInfoFeriado = (fecha) => {
  const date = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
  const mes = date.getMonth() + 1;
  const dia = date.getDate();

  const feriado = FERIADOS_FIJOS.find(f => f.mes === mes && f.dia === dia);
  if (feriado) {
    return { tipo: 'fijo', ...feriado };
  }

  // Verificar Semana Santa
  const year = date.getFullYear();
  const pascua = calcularPascua(year);
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);

  const fechaStr = date.toDateString();
  if (fechaStr === juevesSanto.toDateString()) {
    return { tipo: 'movil', nombre: 'Jueves Santo' };
  }
  if (fechaStr === viernesSanto.toDateString()) {
    return { tipo: 'movil', nombre: 'Viernes Santo' };
  }

  return null;
};

// ============================================
// FUNCIONES DE CÁLCULO DE HORAS
// ============================================

/**
 * Calcula las horas entre dos momentos del día
 * @param {string} horaInicio - Formato "HH:MM"
 * @param {string} horaFin - Formato "HH:MM"
 * @returns {number} Horas decimales
 */
export const calcularHoras = (horaInicio, horaFin) => {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);

  let inicio = hi + mi / 60;
  let fin = hf + mf / 60;

  // Si la hora de fin es menor que inicio, significa que cruza medianoche
  if (fin < inicio) {
    fin += 24;
  }

  return fin - inicio;
};

/**
 * Divide las horas trabajadas en segmentos según el horario (diurno/nocturno)
 * @param {string} horaInicio - Formato "HH:MM"
 * @param {string} horaFin - Formato "HH:MM"
 * @returns {Object} { horasDiurnas, horasNocturnas }
 */
export const dividirHorasPorSegmento = (horaInicio, horaFin) => {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);

  let inicio = hi + mi / 60;
  let fin = hf + mf / 60;

  // Si cruza medianoche
  if (fin < inicio) {
    fin += 24;
  }

  let horasDiurnas = 0;
  let horasNocturnas = 0;

  // Horario diurno: 6:00 AM (6) a 10:00 PM (22)
  // Horario nocturno: 10:00 PM (22) a 6:00 AM (6 del día siguiente = 30)

  // Caso 1: Todo el turno es diurno (6-22)
  if (inicio >= 6 && fin <= 22) {
    horasDiurnas = fin - inicio;
  }
  // Caso 2: Todo el turno es nocturno (22-30 o 0-6)
  else if ((inicio >= 22 && fin <= 30) || (inicio >= 0 && fin <= 6)) {
    horasNocturnas = fin - inicio;
  }
  // Caso 3: Empieza diurno y termina nocturno
  else if (inicio >= 6 && inicio < 22 && fin > 22) {
    horasDiurnas = 22 - inicio;
    horasNocturnas = fin - 22;
  }
  // Caso 4: Empieza nocturno (noche anterior) y termina diurno
  else if (inicio >= 0 && inicio < 6 && fin > 6) {
    horasNocturnas = 6 - inicio;
    horasDiurnas = fin - 6;
  }
  // Caso 5: Empieza diurno y cruza toda la noche hasta el día siguiente
  else if (inicio >= 6 && inicio < 22 && fin > 30) {
    horasDiurnas = 22 - inicio;
    horasNocturnas = 8; // 22 a 6 (del siguiente día)
    horasDiurnas += (fin - 30); // Horas después de las 6 AM
  }

  return { horasDiurnas, horasNocturnas };
};

/**
 * Redondea las horas a la media hora más cercana
 * @param {number} horasDecimales - Horas en formato decimal
 * @returns {number} Horas redondeadas a 0.5
 */
export const redondearMediaHora = (horasDecimales) => {
  return Math.round(horasDecimales * 2) / 2;
};

/**
 * Calcula los totales de horas extras según el tipo de día y horario
 * @param {Array} extrasInfo - Array de objetos con { dia, horaInicio, horaFin, st }
 * @param {string} departamento - Nombre del departamento (para lógica especial de "Comercial")
 * @returns {Object} { tiempoMedio, tiempoDoble, tiempoDobleDoble }
 */
export const calcularTotalesHorasExtras = (extrasInfo, departamento = '') => {
  let tiempoMedio = 0;
  let tiempoDoble = 0;
  let tiempoDobleDoble = 0;

  const esComercial = departamento === 'Comercial';

  extrasInfo.forEach(extra => {
    if (!extra.dia || !extra.horaInicio || !extra.horaFin) return;

    // ✅ Caso especial: Disponibilidad de celular
    // Se identifica por el ST especial y se cuenta como tiempo medio (1.5x)
    if (extra.st === 'DISPONIBILIDAD_CELULAR') {
      // La hora fin contiene los días en formato HH:MM (ej: "07:00" = 7 días = 7 horas)
      const [horas] = extra.horaFin.split(':').map(Number);
      tiempoMedio += horas;
      return;
    }

    const { horasDiurnas, horasNocturnas } = dividirHorasPorSegmento(
      extra.horaInicio,
      extra.horaFin
    );

    const totalHoras = horasDiurnas + horasNocturnas;

    // Lógica especial para departamento Comercial: todo es tiempo medio
    if (esComercial) {
      tiempoMedio += totalHoras;
      return;
    }

    // Lógica normal para otros departamentos
    const fecha = new Date(extra.dia + 'T00:00:00');
    const esDomingoDia = esDomingo(fecha);
    const esFeriadoDia = esFeriado(fecha);

    if (esDomingoDia || esFeriadoDia) {
      // Domingos y feriados
      if (horasNocturnas > 0) {
        tiempoDobleDoble += horasNocturnas; // 4x
      }
      if (horasDiurnas > 0) {
        tiempoDoble += horasDiurnas; // 2x
      }
    } else {
      // Días normales
      if (horasNocturnas > 0) {
        tiempoDoble += horasNocturnas; // 2x
      }
      if (horasDiurnas > 0) {
        tiempoMedio += horasDiurnas; // 1.5x
      }
    }
  });

  return {
    tiempoMedio: redondearMediaHora(tiempoMedio).toFixed(2),
    tiempoDoble: redondearMediaHora(tiempoDoble).toFixed(2),
    tiempoDobleDoble: redondearMediaHora(tiempoDobleDoble).toFixed(2),
  };
};

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida que los horarios sean correctos según las reglas de negocio
 * REGLAS ENTRE SEMANA (excepto feriados):
 * - De 5:00 PM a 11:59 PM: mismo día
 * - De 12:00 AM a 7:30 AM: día SIGUIENTE
 * - Hora de salida debe ser mayor que hora de inicio (mismo día)
 *
 * @param {string} dia - Fecha en formato "YYYY-MM-DD"
 * @param {string} horaInicio - Hora en formato "HH:MM"
 * @param {string} horaFin - Hora en formato "HH:MM"
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validarHorarioTrabajo = (dia, horaInicio, horaFin) => {
  if (!dia || !horaInicio || !horaFin) {
    return { valid: true };
  }

  // Crear fecha local sin conversión de zona horaria
  const [year, month, day] = dia.split('-');
  const fecha = new Date(year, month - 1, day);
  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const esFeriadoDia = esFeriado(fecha);

  // Convertir horas a minutos desde medianoche
  const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
  const [finHora, finMin] = horaFin.split(':').map(Number);

  const inicioMinutos = inicioHora * 60 + inicioMin;
  const finMinutos = finHora * 60 + finMin;

  const { LABORAL_INICIO, LABORAL_FIN } = HORARIOS;
  const medianoche = 0;

  // REGLA 1: Hora de fin no puede ser menor que hora de inicio en el MISMO día
  if (finMinutos <= inicioMinutos) {
    return {
      valid: false,
      message: 'La hora de salida debe ser mayor que la hora de inicio. Si trabajó después de medianoche, debe registrar el día siguiente para las horas de 12:00 AM a 7:30 AM'
    };
  }

  // Solo validar entre semana (lunes a viernes) que NO sean feriados
  if (diaSemana >= 1 && diaSemana <= 5 && !esFeriadoDia) {
    // Caso A: Horario de tarde/noche (5:00 PM - 11:59 PM)
    if (inicioMinutos >= LABORAL_FIN) {
      return { valid: true };
    }

    // Caso B: Horario de madrugada (12:00 AM - 7:30 AM)
    if (inicioMinutos >= medianoche && inicioMinutos < LABORAL_INICIO) {
      if (finMinutos > LABORAL_INICIO) {
        return {
          valid: false,
          message: 'Para horas entre 12:00 AM y 7:30 AM, debe terminar antes de las 7:30 AM'
        };
      }
      return { valid: true };
    }

    // Caso C: Dentro del horario laboral (7:30 AM - 5:00 PM)
    if (inicioMinutos >= LABORAL_INICIO && inicioMinutos < LABORAL_FIN) {
      return {
        valid: false,
        message: 'No se pueden registrar horas extras durante el horario laboral (7:30 AM - 5:00 PM). Las horas extras son desde las 5:00 PM a 11:59 PM del mismo día, o de 12:00 AM a 7:30 AM del día siguiente'
      };
    }

    // Caso D: Si termina dentro del horario laboral
    if (finMinutos > LABORAL_INICIO && finMinutos < LABORAL_FIN) {
      return {
        valid: false,
        message: 'No se pueden registrar horas extras que terminen durante el horario laboral (7:30 AM - 5:00 PM)'
      };
    }
  }

  return { valid: true };
};

/**
 * Valida que la fecha no sea futura
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD"
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validarFechaNoFutura = (fecha) => {
  if (!fecha) return { valid: true };

  const [year, month, day] = fecha.split('-');
  const fechaExtra = new Date(year, month - 1, day);
  fechaExtra.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (fechaExtra > today) {
    return {
      valid: false,
      message: 'La fecha no puede ser mayor a hoy'
    };
  }

  return { valid: true };
};

// ============================================
// FUNCIONES DE PERÍODO DE BLOQUEO
// ============================================

/**
 * Verifica si estamos en período de bloqueo para ingreso de horas extras
 * Bloquea 6 días antes del 15 y 30 de cada mes
 * @param {Date} [fecha=new Date()] - Fecha a verificar (por defecto hoy)
 * @returns {Object} { isBlocked: boolean, message: string, nextAvailableDate: Date|null }
 */
export const verificarPeriodoBloqueo = (fecha = new Date()) => {
  const currentDay = fecha.getDate();
  const currentMonth = fecha.getMonth();
  const currentYear = fecha.getFullYear();

  const { PRIMER_PERIODO, SEGUNDO_PERIODO } = PERIODOS_BLOQUEO;

  // Primer período: del 9 al 14 (6 días antes del 15)
  if (currentDay >= PRIMER_PERIODO.inicio && currentDay <= PRIMER_PERIODO.fin) {
    const nextAvailableDate = new Date(currentYear, currentMonth, 15);
    return {
      isBlocked: true,
      message: `El sistema está cerrado del ${PRIMER_PERIODO.inicio} al ${PRIMER_PERIODO.fin} de cada mes. Podrá ingresar horas extras nuevamente a partir del 15 de ${nextAvailableDate.toLocaleDateString('es-ES', { month: 'long' })}.`,
      nextAvailableDate
    };
  }

  // Segundo período: del 24 al 29 (6 días antes del 30)
  if (currentDay >= SEGUNDO_PERIODO.inicio && currentDay <= SEGUNDO_PERIODO.fin) {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const nextDay = daysInMonth >= 30 ? 30 : 1;
    const nextMonth = daysInMonth >= 30 ? currentMonth : currentMonth + 1;
    const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
    const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;

    const nextAvailableDate = new Date(nextYear, adjustedMonth, nextDay);
    return {
      isBlocked: true,
      message: `El sistema está cerrado del ${SEGUNDO_PERIODO.inicio} al ${SEGUNDO_PERIODO.fin} de cada mes. Podrá ingresar horas extras nuevamente a partir del ${nextDay} de ${nextAvailableDate.toLocaleDateString('es-ES', { month: 'long' })}.`,
      nextAvailableDate
    };
  }

  return {
    isBlocked: false,
    message: '',
    nextAvailableDate: null
  };
};

/**
 * Obtiene la fecha máxima permitida para registro (hoy)
 * @returns {string} Fecha en formato "YYYY-MM-DD"
 */
export const obtenerFechaMaxima = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea las horas en formato legible
 * @param {number|string} horas - Horas a formatear
 * @returns {string} Horas formateadas (ej: "8.50 hrs")
 */
export const formatearHoras = (horas) => {
  const horasNum = typeof horas === 'string' ? parseFloat(horas) : horas;
  return `${horasNum.toFixed(2)} hrs`;
};

/**
 * Convierte minutos a formato HH:MM
 * @param {number} minutos - Minutos totales
 * @returns {string} Formato "HH:MM"
 */
export const minutosAHoraFormato = (minutos) => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Convierte formato HH:MM a minutos
 * @param {string} horaFormato - Hora en formato "HH:MM"
 * @returns {number} Minutos totales
 */
export const horaFormatoAMinutos = (horaFormato) => {
  const [horas, minutos] = horaFormato.split(':').map(Number);
  return horas * 60 + minutos;
};

// Exportación por defecto de todas las funciones
export default {
  // Feriados
  calcularPascua,
  esFeriado,
  esDomingo,
  getInfoFeriado,

  // Cálculos
  calcularHoras,
  dividirHorasPorSegmento,
  redondearMediaHora,
  calcularTotalesHorasExtras,

  // Validaciones
  validarHorarioTrabajo,
  validarFechaNoFutura,

  // Período de bloqueo
  verificarPeriodoBloqueo,
  obtenerFechaMaxima,

  // Utilidades
  formatearHoras,
  minutosAHoraFormato,
  horaFormatoAMinutos,

  // Constantes
  HORARIOS,
  FERIADOS_FIJOS,
  PERIODOS_BLOQUEO,
};

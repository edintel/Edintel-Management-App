const findPeriodForDate = (date, periodsArray) => {
  const expenseDate = new Date(date);
  return periodsArray.find(
    (period) => expenseDate >= period.inicio && expenseDate <= period.fin
  );
};
// src/utils/periodUtils.js

/**
 * Gets the Monday of the week for a given date
 * @param {Date} date - The date to get the Monday for
 * @returns {Date} The Monday of the week
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Gets the Sunday of the week for a given date
 * @param {Date} date - The date to get the Sunday for
 * @returns {Date} The Sunday of the week
 */
const getWeekEnd = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Creates a period identifier string from a date
 * @param {Date} date - The date to create the period for
 * @returns {string} The period identifier (e.g., "2024-W43")
 */
const createPeriodIdentifier = (date) => {
  const start = getWeekStart(date);
  const year = start.getFullYear();
  const weekNum = Math.ceil(
    (start.getTime() - new Date(year, 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
};

/**
 * Finds or suggests a period for a given date
 * @param {Date} date - The date to find/create a period for
 * @param {Array} periodsArray - Array of existing periods
 * @returns {Object} Object containing period info and whether it needs to be created
 */
const findOrCreatePeriodForDate = (date, periodsArray) => {
  const expenseDate = new Date(date);
  const weekStart = getWeekStart(expenseDate);
  const weekEnd = getWeekEnd(expenseDate);

  // Try to find existing period
  const existingPeriod = periodsArray.find(
    (period) =>
      expenseDate >= new Date(period.inicio) &&
      expenseDate <= new Date(period.fin)
  );

  if (existingPeriod) {
    return {
      exists: true,
      period: existingPeriod,
    };
  }

  // Create new period suggestion
  return {
    exists: false,
    period: {
      inicio: weekStart,
      fin: weekEnd,
      periodo: createPeriodIdentifier(expenseDate),
    },
  };
};

/**
 * Formats a period range for display
 * @param {Date} start - Period start date
 * @param {Date} end - Period end date
 * @returns {string} Formatted date range
 */
const formatPeriodRange = (start, end) => {
  const formatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  return `${start.toLocaleDateString(
    "es-CR",
    formatOptions
  )} - ${end.toLocaleDateString("es-CR", formatOptions)}`;
};

/**
 * Validates if a date falls within any given period
 * @param {Date} date - The date to validate
 * @param {Array} periodsArray - Array of existing periods
 * @returns {boolean} Whether the date is valid
 */
const isDateInAnyPeriod = (date, periodsArray) => {
  const expenseDate = new Date(date);
  return periodsArray.some(
    (period) =>
      expenseDate >= new Date(period.inicio) &&
      expenseDate <= new Date(period.fin)
  );
};

export {
  findPeriodForDate,
  findOrCreatePeriodForDate,
  formatPeriodRange,
  getWeekStart,
  getWeekEnd,
  createPeriodIdentifier,
  isDateInAnyPeriod,
};

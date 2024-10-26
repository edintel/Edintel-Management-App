export const findPeriodForDate = (date, periodsArray) => {
    const expenseDate = new Date(date);
    return periodsArray.find(period => 
      expenseDate >= period.inicio && expenseDate <= period.fin
    );
  };
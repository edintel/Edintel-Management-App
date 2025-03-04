export const getExpenseStatus = (expense) => {
    if (
        expense.aprobacionAsistente === "No aprobada" ||
        expense.aprobacionJefatura === "No aprobada" ||
        expense.aprobacionContabilidad === "No aprobada"
    ) {
        return "No aprobada";
    }
    if (expense.aprobacionContabilidad === "Aprobada") {
        return "Aprobada por Contabilidad";
    }
    if (
        expense.aprobacionJefatura === "Aprobada" &&
        expense.aprobacionContabilidad === "Pendiente"
    ) {
        return "Aprobada por Jefatura";
    }
    if (
        expense.aprobacionAsistente === "Aprobada" &&
        expense.aprobacionJefatura === "Pendiente"
    ) {
        return "Aprobada por Asistente";
    }
    return "Pendiente";
};
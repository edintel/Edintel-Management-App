import { CheckCircle, Play, Lock, FileCheck } from "lucide-react";

export const getUpdateStatusLabel = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return "Confirmar Asignación";
    case "Confirmado por técnico":
      return "Iniciar Trabajo";
    case "Trabajo iniciado":
      return "Finalizar Trabajo";
    case "Finalizada":
      return "Cerrar Ticket";
    default:
      return "Actualizar Estado";
  }
};

export const getUpdateStatusIcon = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return CheckCircle;
    case "Confirmado por técnico":
      return Play;
    case "Trabajo iniciado":
      return FileCheck;
    case "Finalizada":
      return Lock;
    default:
      return CheckCircle;
  }
};

export const getUpdateStatusVariant = (currentState) => {
  switch (currentState) {
    case "Finalizada":
      return "success";
    default:
      return "primary";
  }
};

export const getUpdateStatusClassName = (currentState) => {
  switch (currentState) {
    case "Finalizada":
      return "text-success hover:bg-success/10";
    default:
      return "text-gray-700 hover:bg-gray-50";
  }
};

export const getNextStatus = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return "Confirmado por técnico";
    case "Confirmado por técnico":
      return "Trabajo iniciado";
    case "Trabajo iniciado":
      return "Finalizada";
    case "Finalizada":
      return "Cerrada";
    default:
      return currentState;
  }
};

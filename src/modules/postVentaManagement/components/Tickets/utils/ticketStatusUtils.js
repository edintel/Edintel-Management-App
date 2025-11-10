import { CheckCircle, Play, Lock, FileCheck, AlertTriangle } from "lucide-react";

export const getUpdateStatusLabel = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return "Confirmar Asignación";
    case "Confirmado por técnico":
      return "Iniciar Trabajo";
    case "Trabajo iniciado":
      return "Actualizar Estado"; // Genérico porque hay dos opciones
    case "Trabajo Parcial":
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
    case "Trabajo Parcial":
      return AlertTriangle;
    case "Finalizada":
      return Lock;
    default:
      return CheckCircle;
  }
};

export const getUpdateStatusVariant = (currentState) => {
  switch (currentState) {
    case "Trabajo Parcial":
      return "warning";
    case "Finalizada":
      return "success";
    default:
      return "primary";
  }
};

export const getUpdateStatusClassName = (currentState) => {
  switch (currentState) {
    case "Trabajo Parcial":
      return "text-warning hover:bg-warning/10";
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
      return null; // Retorna null porque hay múltiples opciones
    case "Trabajo Parcial":
      return "Finalizada";
    case "Reasignar Técnico":
      return null;
    case "Finalizada":
      return "Cerrada";
    default:
      return currentState;
  }
};
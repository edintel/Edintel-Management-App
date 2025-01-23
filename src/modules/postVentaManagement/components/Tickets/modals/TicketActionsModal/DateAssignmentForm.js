import React, { useState } from "react";
import { Calendar } from "lucide-react";
import Button from "../../../../../../components/common/Button";

const DateAssignmentForm = ({ ticket, onSubmit, processing }) => {
  const [selectedDate, setSelectedDate] = useState(ticket?.tentativeDate ? ticket.tentativeDate.slice(0, 16) : "");

  const handleSubmit = () => {
    if (!selectedDate) return;
    onSubmit(ticket.id, selectedDate + ":00");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-500 mb-1">
          Seleccionar Nueva Fecha
        </label>
        <input
          type="datetime-local"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>
      <Button
        variant="primary"
        fullWidth
        onClick={handleSubmit}
        disabled={processing || !selectedDate}
        startIcon={<Calendar className="h-4 w-4" />}
      >
        Confirmar Fecha
      </Button>
    </div>
  );
};

export default DateAssignmentForm;
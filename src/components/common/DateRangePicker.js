import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState(() =>
    startDate ? new Date(startDate) : new Date()
  );
  const [hoverDate, setHoverDate] = useState(null);
  const containerRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate calendar data
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Add empty cells for days before first of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    return days;
  };

  const isDateInRange = (date) => {
    if (!date || !startDate || (!endDate && !hoverDate)) return false;

    const compareDate = Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const start = Date.UTC(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth(),
      new Date(startDate).getDate()
    );
    const end = endDate
      ? Date.UTC(
          new Date(endDate).getFullYear(),
          new Date(endDate).getMonth(),
          new Date(endDate).getDate()
        )
      : Date.UTC(
          hoverDate.getFullYear(),
          hoverDate.getMonth(),
          hoverDate.getDate()
        );

    return compareDate >= start && compareDate <= end;
  };

  const isDateSelectable = (date) => {
    if (!date) return false;

    // Convert all dates to UTC midnight for consistent comparison
    const compareDate = Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const min = minDate
      ? Date.UTC(
          new Date(minDate).getFullYear(),
          new Date(minDate).getMonth(),
          new Date(minDate).getDate()
        )
      : -Infinity;

    // Set maxDate to end of day (23:59:59.999) for inclusive comparison
    const max = maxDate
      ? (() => {
          const date = new Date(maxDate);
          date.setDate(date.getDate() + 1);
          return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        })()
      : Infinity;

    return compareDate >= min && compareDate <= max;
  };

  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) return;

    // Ensure we're working with UTC dates
    const clickedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );

    const formattedDate = clickedDate.toISOString().split("T")[0];

    if (!startDate || (startDate && endDate) || date < new Date(startDate)) {
      onStartDateChange(formattedDate);
      onEndDateChange(null);
    } else {
      onEndDateChange(formattedDate);
    }
  };

  const handleMouseEnter = (date) => {
    if (startDate && !endDate && date) {
      setHoverDate(date);
    }
  };

  const handlePrevMonth = () => {
    setActiveMonth(
      new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setActiveMonth(
      new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1)
    );
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const days = getDaysInMonth(
    activeMonth.getFullYear(),
    activeMonth.getMonth()
  );

  const monthName = activeMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Input display */}
      <div
        className="flex items-center gap-2 w-full p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {formatDisplayDate(startDate) || "Fecha inicio"}
          {" - "}
          {formatDisplayDate(endDate) || "Fecha final"}
        </span>
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium">{monthName}</span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-8" />;
              }

              const isSelected =
                (startDate && date.toISOString().split("T")[0] === startDate) ||
                (endDate && date.toISOString().split("T")[0] === endDate);
              const isInRange = isDateInRange(date);
              const isSelectable = isDateSelectable(date);

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "h-8 flex items-center justify-center text-sm rounded-full transition-colors",
                    {
                      "cursor-pointer hover:bg-primary/10": isSelectable,
                      "cursor-not-allowed opacity-50": !isSelectable,
                      "bg-primary text-white": isSelected,
                      "bg-primary/10": isInRange && !isSelected,
                    }
                  )}
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => handleMouseEnter(date)}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

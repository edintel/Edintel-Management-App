import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [activeYear, setActiveYear] = useState(() => activeMonth.getFullYear());
  const [hoverDate, setHoverDate] = useState(null);
  const containerRef = useRef(null);

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

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

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
    if (activeMonth.getMonth() === 0) {
      setActiveYear((prev) => prev - 1);
      setActiveMonth(new Date(activeYear - 1, 11));
    } else {
      setActiveMonth(new Date(activeYear, activeMonth.getMonth() - 1));
    }
  };

  const handleNextMonth = () => {
    if (activeMonth.getMonth() === 11) {
      setActiveYear((prev) => prev + 1);
      setActiveMonth(new Date(activeYear + 1, 0));
    } else {
      setActiveMonth(new Date(activeYear, activeMonth.getMonth() + 1));
    }
  };

  const handleYearChange = (year) => {
    setActiveYear(year);
    setActiveMonth(new Date(year, activeMonth.getMonth()));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onStartDateChange(null);
    onEndDateChange(null);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const localDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );
    return localDate.toLocaleDateString();
  };

  const days = getDaysInMonth(
    activeMonth.getFullYear(),
    activeMonth.getMonth()
  );

  const years = Array.from({ length: 10 }, (_, i) => activeYear - 5 + i);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className="relative bg-gray-50 flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 flex-1">
          {formatDisplayDate(startDate) || "Fecha inicio"}
          {" - "}
          {formatDisplayDate(endDate) || "Fecha final"}
        </span>
        {(startDate || endDate) && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={activeMonth.getMonth()}
                onChange={(e) =>
                  setActiveMonth(new Date(activeYear, parseInt(e.target.value)))
                }
                className="p-1 border rounded"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <select
                value={activeYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="p-1 border rounded"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

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

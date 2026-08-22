import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 31 }, (_, i) => 2000 + i);

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial value or default to current date
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(value);

  const containerRef = useRef<HTMLDivElement>(null);

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    setSelectedDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
    // Reset to value
    if (value) {
      const d = new Date(value);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
      setSelectedDate(value);
    } else {
      setSelectedDate('');
    }
  };

  const handleOk = () => {
    onChange(selectedDate);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  return (
    <div className="relative w-full md:w-64" ref={containerRef}>
      {/* Trigger Button */}
      <div
        className="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white py-2.5 pr-4 pl-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{value ? `Date: ${value}` : 'Date: All'}</span>
        </div>
        <div className="flex items-center gap-2">
          {value ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate('');
                onChange('');
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              type="button"
              title="Clear date"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="relative flex gap-4">
              {/* Month Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="cursor-pointer bg-transparent text-sm font-semibold text-gray-800 hover:text-blue-600 focus:outline-none"
                  onClick={() => {
                    setIsMonthOpen(!isMonthOpen);
                    setIsYearOpen(false);
                  }}
                >
                  {MONTHS[currentMonth]}
                </button>
                {isMonthOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-32 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {MONTHS.map((m, i) => (
                      <div
                        key={m}
                        className={`cursor-pointer px-3 py-1.5 text-sm hover:bg-blue-50 ${currentMonth === i ? 'bg-blue-100 font-semibold' : ''}`}
                        onClick={() => {
                          setCurrentMonth(i);
                          setIsMonthOpen(false);
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="cursor-pointer bg-transparent text-sm font-semibold text-gray-800 hover:text-blue-600 focus:outline-none"
                  onClick={() => {
                    setIsYearOpen(!isYearOpen);
                    setIsMonthOpen(false);
                  }}
                >
                  {currentYear}
                </button>
                {isYearOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-24 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {YEARS.map((y) => (
                      <div
                        key={y}
                        className={`cursor-pointer px-3 py-1.5 text-sm hover:bg-blue-50 ${currentYear === y ? 'bg-blue-100 font-semibold' : ''}`}
                        onClick={() => {
                          setCurrentYear(y);
                          setIsYearOpen(false);
                        }}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handlePrevMonth}
                className="rounded p-1 hover:bg-gray-100"
                type="button"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded p-1 hover:bg-gray-100"
                type="button"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-500">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  type="button"
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex justify-end gap-2 text-sm font-medium">
            <button
              onClick={() => {
                setSelectedDate('');
                onChange('');
                setIsOpen(false);
                setIsMonthOpen(false);
                setIsYearOpen(false);
              }}
              className="mr-auto rounded px-3 py-1.5 text-red-600 hover:bg-red-50"
              type="button"
            >
              CLEAR
            </button>
            <button
              onClick={handleCancel}
              className="rounded px-3 py-1.5 text-gray-600 hover:bg-gray-100"
              type="button"
            >
              CANCEL
            </button>
            <button
              onClick={handleOk}
              className="rounded bg-gray-800 px-4 py-1.5 text-white hover:bg-gray-700"
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

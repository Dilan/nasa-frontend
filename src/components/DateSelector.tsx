import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  disabled?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  selectedDate, 
  onDateChange, 
  availableDates,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedDateRef = useRef<HTMLButtonElement>(null);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    console.log('availableDates amount:', availableDates.length);
  }, [availableDates]);

  // useEffect(() => {
  //   if (isOpen && selectedDate && selectedDateRef.current) {
  //     // Small delay to ensure the dropdown is fully rendered
  //     setTimeout(() => {
  //       selectedDateRef.current?.scrollIntoView({
  //         behavior: 'smooth',
  //         block: 'center'
  //       });
  //     }, 100);
  //   }
  // }, [isOpen, selectedDate]);

  // Auto-scroll to selected date when dropdown opens
  useEffect(() => {
    if (isOpen && selectedDate && availableDates.length > 0) {
      const selectedIndex = availableDates.indexOf(selectedDate);
      if (selectedIndex !== -1) {
        // Small delay to ensure the dropdown is rendered
        setTimeout(() => {
          const dropdown = document.querySelector('.date-dropdown');
          const selectedItem = dropdown?.querySelector(`[data-date="${selectedDate}"]`);
          if (selectedItem && dropdown) {
            selectedItem.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 50);
      }
    }
  }, [isOpen, selectedDate, availableDates]);

  return (
    <div className="relative">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-md mx-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">Selected Date</p>
              <p className="text-blue-200 text-sm">
                {loading ? 'Loading...' : formatDisplayDate(selectedDate)}
              </p>
            </div>
          </div>
          <ChevronDown 
            className={`h-5 w-5 text-blue-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && !loading && (
          <div className="date-dropdown absolute top-full left-0 right-0 z-50 mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto backdrop-blur-sm">
            {availableDates.map((date) => (
              <button
                key={date}
                data-date={date}
                onClick={() => {
                  onDateChange(date);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 ${
                  date === selectedDate ? 'bg-blue-500/20 text-blue-200' : 'text-white'
                }`}
              >
                <div className="font-medium">{formatDisplayDate(date)}</div>
                <div className="text-sm text-blue-300">{date}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateSelector;
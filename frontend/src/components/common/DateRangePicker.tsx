import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../ui/Popover';
import { Button } from '../ui/Button';
import { 
  Calendar as CalendarComponent
} from '../ui/Calendar';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  value: {
    start: Date;
    end: Date;
  };
  onChange: (range: { start: Date; end: Date }) => void;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRange>({
    from: value.start,
    to: value.end
  });

  // Handle date selection
  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setSelectedRange(range);
      
      if (range.to) {
        // Complete selection
        onChange({
          start: range.from,
          end: range.to
        });
        setIsSelecting(false);
      } else {
        // Starting selection
        setIsSelecting(true);
      }
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    if (value.start && value.end) {
      return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
    }
    return 'Select date range';
  };

  // Predefined date ranges
  const predefinedRanges = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ];

  // Apply predefined range
  const applyPredefinedRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setSelectedRange({ from: start, to: end });
    onChange({ start, end });
    setIsSelecting(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={`w-full justify-start text-left font-normal ${!value.start ? 'text-muted-foreground' : ''}`}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">Select date range</h3>
            <Button 
              className="h-8 px-2 text-xs"
              onClick={() => setIsSelecting(false)}
            >
              Cancel
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {predefinedRanges.map((range) => (
              <Button
                key={range.label}
                className="h-8 text-xs"
                onClick={() => applyPredefinedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <CalendarComponent
          mode="range"
          selected={{
            from: selectedRange.from,
            to: selectedRange.to
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker; 
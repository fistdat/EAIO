import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from './Button';
import { Calendar } from './Calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './Popover';
import { cn } from '../../lib/utils';

export type DateRangePickerProps = {
  className?: string;
  onSelect: (dateRange: DateRange | undefined) => void;
  initialDateRange?: DateRange;
  align?: 'start' | 'center' | 'end';
  showComparisonPeriod?: boolean;
};

export function DateRangePicker({
  className,
  onSelect,
  initialDateRange,
  align = 'start',
  showComparisonPeriod = false,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange
  );
  const [isOpen, setIsOpen] = useState(false);

  // Handle external date range changes
  useEffect(() => {
    if (initialDateRange) {
      setDateRange(initialDateRange);
    }
  }, [initialDateRange]);

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    onSelect(range);
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align={align}
          sideOffset={4}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 
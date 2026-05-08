import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import 'react-day-picker/dist/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={it}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-3',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold capitalize',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-90 hover:opacity-100 rounded-md inline-flex items-center justify-center border border-primary/40 text-primary hover:bg-primary/10'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.75rem] uppercase',
        row: 'flex w-full mt-1',
        cell: 'h-9 w-9 text-center text-sm p-0 relative',
        day: cn(
          'h-9 w-9 p-0 font-medium text-foreground aria-selected:opacity-100 rounded-md inline-flex items-center justify-center hover:bg-muted'
        ),
        day_selected: '!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground font-bold',
        day_today: 'border border-primary/60',
        day_outside: 'text-muted-foreground/70',
        day_disabled: 'text-muted-foreground cursor-not-allowed line-through',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 text-primary" strokeWidth={2.5} />,
        IconRight: () => <ChevronRight className="h-4 w-4 text-primary" strokeWidth={2.5} />,
      }}
      {...props}
    />
  );
}

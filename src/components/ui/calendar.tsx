"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  useDayPicker,
  useNavigation,
  type CaptionProps,
} from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2020, month, 1).toLocaleDateString("en-US", { month: "long" }),
);

// react-day-picker v8 renders a native <select> plus a second visible caption
// for every dropdown. Replacing the whole Caption component avoids both the
// native control and the duplicated labels, and lets us use the app's Select.
function CalendarCaption({ displayMonth }: CaptionProps) {
  const { fromDate, toDate } = useDayPicker();
  const { goToMonth, previousMonth, nextMonth } = useNavigation();

  const fallbackYear = new Date().getFullYear();
  const fromYear = fromDate?.getFullYear() ?? 2020;
  const toYear = toDate?.getFullYear() ?? fallbackYear;

  const years = React.useMemo(() => {
    const list: number[] = [];
    // Newest first so the current year is immediately visible.
    for (let year = toYear; year >= fromYear; year -= 1) list.push(year);
    return list;
  }, [fromYear, toYear]);

  // Never move outside the selectable range, so the grid cannot land on a
  // month where every day is disabled.
  const clampToRange = (date: Date) => {
    const next = new Date(date);
    next.setDate(1);
    const min = fromDate
      ? new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
      : null;
    const max = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), 1) : null;
    if (min && next < min) return min;
    if (max && next > max) return max;
    return next;
  };

  const changeMonth = (value: string) => {
    const next = new Date(displayMonth);
    next.setDate(1);
    next.setMonth(Number(value));
    goToMonth(clampToRange(next));
  };

  const changeYear = (value: string) => {
    const next = new Date(displayMonth);
    next.setDate(1);
    next.setFullYear(Number(value));
    goToMonth(clampToRange(next));
  };

  const isMonthDisabled = (month: number) => {
    const firstOfMonth = new Date(displayMonth.getFullYear(), month, 1);
    const min = fromDate
      ? new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
      : null;
    const max = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), 1) : null;
    return Boolean((min && firstOfMonth < min) || (max && firstOfMonth > max));
  };

  const monthLabel = displayMonth.toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="flex items-center gap-1.5 pb-2">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        aria-label="Previous month"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "size-7 shrink-0 bg-transparent p-0 opacity-70 hover:opacity-100 disabled:opacity-30",
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      <Select value={String(displayMonth.getMonth())} onValueChange={changeMonth}>
        <SelectTrigger
          aria-label="Month"
          className="h-8 min-w-[6.5rem] flex-1 gap-1 px-2 text-xs"
        >
          <SelectValue>{monthLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          collisionPadding={8}
          className="max-h-64 [&_[data-radix-select-viewport]]:h-auto"
        >
          {MONTHS.map((label, month) => (
            <SelectItem
              key={label}
              value={String(month)}
              disabled={isMonthDisabled(month)}
              className="py-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(displayMonth.getFullYear())}
        onValueChange={changeYear}
      >
        <SelectTrigger
          aria-label="Year"
          className="h-8 w-[4.75rem] shrink-0 px-2 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="center"
          collisionPadding={8}
          className="max-h-64 [&_[data-radix-select-viewport]]:h-auto"
        >
          {years.map((year) => (
            <SelectItem
              key={year}
              value={String(year)}
              className="py-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
            >
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        aria-label="Next month"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "size-7 shrink-0 bg-transparent p-0 opacity-70 hover:opacity-100 disabled:opacity-30",
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-foreground",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CalendarCaption,
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };

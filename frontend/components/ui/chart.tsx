"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-md border", className)}
        {...props}
      />
    );
  }
);
Chart.displayName = "Chart";

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />;
  }
);
ChartContainer.displayName = "ChartContainer";

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />;
  }
);
ChartTooltip.displayName = "ChartTooltip";

interface ChartTooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    name: string;
    color: string;
    valueFormatter: (value: number) => string;
  }[];
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ className, items, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-2 bg-white rounded-md shadow-md", className)}
      {...props}
    >
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between text-sm"
        >
          <span className="font-medium">{item.name}</span>
          <span className="text-muted-foreground">
            {item.valueFormatter(123)}
          </span>
        </div>
      ))}
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-2", className)}
        {...props}
      />
    );
  }
);
ChartLegend.displayName = "ChartLegend";

interface ChartLegendItemProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  color: string;
}

const ChartLegendItem = React.forwardRef<HTMLDivElement, ChartLegendItemProps>(
  ({ className, name, color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-1 text-sm", className)}
        {...props}
      >
        <span
          className="block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{name}</span>
      </div>
    );
  }
);
ChartLegendItem.displayName = "ChartLegendItem";

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendItem,
};

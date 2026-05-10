"use client";

import {
  ChartContainer,
  ChartTooltipContent as UiChartTooltipContent,
  ChartLegend,
  ChartLegendItem,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip, // Alias Recharts Tooltip
} from "recharts";
import { useChartData } from "@/hooks/use-chart-data";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
  }>;
}

function CustomChartTooltip({ active, payload }: Readonly<ChartTooltipProps>) {
  if (active && payload?.length) {
    const tooltipItems = payload
      .map((pld) => {
        if (!pld.name || typeof pld.value !== "number") return null;

        let color = "";
        const dataKey = String(pld.name);
        let displayName = dataKey;

        if (dataKey === "auftraege") {
          color = "#3b82f6";
          displayName = "Aufträge";
        } else if (dataKey === "anfragen") {
          color = "#93c5fd";
          displayName = "Anfragen";
        }
        return {
          name: displayName,
          color: color,
          valueFormatter: (value: number) => `${value}`,
        };
      })
      .filter(
        (
          item
        ): item is {
          name: string;
          color: string;
          valueFormatter: (value: number) => string;
        } => item !== null
      );

    return (
      <UiChartTooltipContent
        className="border-none shadow-lg bg-card text-card-foreground p-2 rounded-md"
        items={tooltipItems}
      />
    );
  }
  return null;
}

export function DashboardChart() {
  const { data, loading, error, refresh, isEmpty } = useChartData();

  // Debug logging
  console.log("DashboardChart Debug:", {
    dataLength: data?.length,
    loading,
    error: error?.message,
    isEmpty,
    sampleData: data?.slice(0, 3),
    rawData: data,
    hasData: !!data && data.length > 0,
    loadingState: loading,
    errorState: error,
  });

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-md">
        <Skeleton className="h-full w-full" />
        <div className="absolute text-sm text-muted-foreground">
          Lade Aktivitätsdiagramm...
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-red-50 rounded-md border border-red-200 space-y-3">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">
            Fehler beim Laden der Aktivitätsdaten
          </p>
          <p className="text-xs text-red-500">{error.message}</p>
        </div>
        <button
          onClick={() => refresh()}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Empty state when no activity data exists
  if (isEmpty) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-md space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Keine Aktivitätsdaten verfügbar
          </p>
          <p className="text-xs text-muted-foreground">
            Es wurden noch keine Aufträge oder Anfragen in den letzten 30 Tagen
            erstellt.
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Aktualisieren
        </button>
      </div>
    );
  }

  // Show chart even if most values are 0 - this is normal for activity charts
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-md space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Keine Daten zum Anzeigen
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Aktualisieren
        </button>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ChartContainer>
        <ChartLegend className="mb-4">
          <ChartLegendItem name="Aufträge" color="#3b82f6" />
          <ChartLegendItem name="Anfragen" color="#93c5fd" />
        </ChartLegend>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
              label={{
                value: "Anzahl",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fontSize: "12px" },
              }}
            />
            <RechartsTooltip content={CustomChartTooltip} />
            <Area
              type="monotone"
              dataKey="auftraege"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="anfragen"
              stroke="#93c5fd"
              fill="#93c5fd"
              fillOpacity={0.2}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

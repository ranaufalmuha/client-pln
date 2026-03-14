"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  bayDefinitions,
  dashboardDates,
  formatDateLabel,
  getPeakAmpereByBayInRange,
  latestDashboardDate,
  normalizeDateRange,
} from "@/shared/lib/dashboard-load";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const chartConfig = {
  cilegon: {
    label: "Cilegon",
    color: "var(--chart-1)",
  },
  depok1: {
    label: "Depok 1",
    color: "var(--chart-2)",
  },
  depok2: {
    label: "Depok 2",
    color: "var(--chart-3)",
  },
  saguling1: {
    label: "Saguling 1",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const defaultStartDate = dashboardDates[Math.max(0, dashboardDates.length - 7)];
const defaultEndDate = latestDashboardDate;

export function ChartAreaInteractive() {
  const [startDate, setStartDate] = React.useState(defaultStartDate);
  const [endDate, setEndDate] = React.useState(defaultEndDate);

  const handleStartDateChange = (value: string) => {
    const normalized = normalizeDateRange(value, endDate);
    setStartDate(normalized.startDate);
    setEndDate(normalized.endDate);
  };

  const handleEndDateChange = (value: string) => {
    const normalized = normalizeDateRange(startDate, value);
    setStartDate(normalized.startDate);
    setEndDate(normalized.endDate);
  };

  const filteredData = React.useMemo(
    () => getPeakAmpereByBayInRange(startDate, endDate),
    [startDate, endDate],
  );

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Pembanding Ampere per Bay</CardTitle>
        <CardDescription>
          Grafik harian dari tanggal awal sampai akhir. Nilai per hari mengambil
          beban tertinggi dari jam 10:00, 14:00, dan 19:00.
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2 @[780px]/card:flex-row">
            <Select value={startDate} onValueChange={handleStartDateChange}>
              <SelectTrigger
                className="w-full @[780px]/card:w-44"
                size="sm"
                aria-label="Pilih tanggal awal"
              >
                <SelectValue placeholder="Tanggal awal" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {dashboardDates.map((dateKey) => (
                  <SelectItem
                    key={`start-${dateKey}`}
                    value={dateKey}
                    className="rounded-lg"
                  >
                    {formatDateLabel(dateKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={endDate} onValueChange={handleEndDateChange}>
              <SelectTrigger
                className="w-full @[780px]/card:w-44"
                size="sm"
                aria-label="Pilih tanggal akhir"
              >
                <SelectValue placeholder="Tanggal akhir" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {dashboardDates.map((dateKey) => (
                  <SelectItem
                    key={`end-${dateKey}`}
                    value={dateKey}
                    className="rounded-lg"
                  >
                    {formatDateLabel(dateKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <LineChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={22}
              tickFormatter={formatDateLabel}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={38}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => formatDateLabel(String(value))}
                  formatter={(value) => `${Number(value).toFixed(2)} A`}
                />
              }
            />
            {bayDefinitions.map((bay) => (
              <Line
                key={bay.key}
                dataKey={bay.key}
                name={bay.label}
                stroke={`var(--color-${bay.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                type="monotone"
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

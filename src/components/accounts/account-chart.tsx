"use client";

import { Transaction } from "@/app/generated/prisma/client";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type DecimalLike = { toNumber: () => number } | number;

type DateRangeKey = "7D" | "1M" | "3M" | "6M" | "ALL";

interface DateRangeConfig {
  label: string;
  days: number | null;
}

interface ChartDataPoint {
  date: string;
  isoDate: string;
  income: number;
  expense: number;
}

const DATE_RANGES: Record<DateRangeKey, DateRangeConfig> = {
  "7D": { label: "7D", days: 7 },
  "1M": { label: "1M", days: 30 },
  "3M": { label: "3M", days: 90 },
  "6M": { label: "6M", days: 180 },
  ALL: { label: "All", days: null },
};

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";

const toNumber = (value: DecimalLike): number =>
  typeof value === "object" && "toNumber" in value
    ? value.toNumber()
    : Number(value);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null;

  const income =
    (payload.find((p) => p.dataKey === "income")?.value as number) ?? 0;
  const expense =
    (payload.find((p) => p.dataKey === "expense")?.value as number) ?? 0;
  const net = income - expense;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-sm min-w-40">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Income
          </span>
          <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(income)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Expense
          </span>
          <span className="tabular-nums font-medium text-rose-600 dark:text-rose-400">
            -{formatCurrency(expense)}
          </span>
        </div>
        <div className="mt-2 border-t border-border pt-2 flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Net</span>
          <span
            className={`tabular-nums font-semibold ${
              net >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {net >= 0 ? "+" : ""}
            {formatCurrency(net)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface AccountChartProps {
  transactions: Transaction[];
}

const AccountChart = ({ transactions }: AccountChartProps) => {
  const [dateRange, setDateRange] = useState<DateRangeKey>("1M");

  const filteredData = useMemo<ChartDataPoint[]>(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate: Date = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));
    const endDate: Date = endOfDay(now);

    const filtered = transactions.filter((t) => {
      const d = new Date(String(t.date));
      return d >= startDate && d <= endDate;
    });

    const grouped = filtered.reduce<Record<string, ChartDataPoint>>(
      (acc, transaction) => {
        const isoKey = format(new Date(String(transaction.date)), "yyyy-MM-dd");
        const displayLabel = format(
          new Date(String(transaction.date)),
          "MMM dd",
        );

        if (!acc[isoKey]) {
          acc[isoKey] = {
            date: displayLabel,
            isoDate: isoKey,
            income: 0,
            expense: 0,
          };
        }

        const amount = toNumber(transaction.amount as DecimalLike);

        if (transaction.type === "INCOME") {
          acc[isoKey].income += amount;
        } else {
          acc[isoKey].expense += amount;
        }

        return acc;
      },
      {},
    );

    return Object.values(grouped).sort((a, b) =>
      a.isoDate.localeCompare(b.isoDate),
    );
  }, [transactions, dateRange]);

  const totals = useMemo(
    () =>
      filteredData.reduce(
        (acc, day) => ({
          income: acc.income + day.income,
          expense: acc.expense + day.expense,
        }),
        { income: 0, expense: 0 },
      ),
    [filteredData],
  );

  const netTotal = totals.income - totals.expense;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Transaction Overview
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {DATE_RANGES[dateRange].label === "All"
                ? "All time"
                : `Last ${DATE_RANGES[dateRange].label}`}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(DATE_RANGES) as DateRangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`
                  rounded-md px-3 py-1 text-xs font-medium transition-all
                  ${
                    dateRange === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {DATE_RANGES[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Income
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
              +{formatCurrency(totals.income)}
            </p>
          </div>
          <div className="rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">
              Expenses
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-300">
              -{formatCurrency(totals.expense)}
            </p>
          </div>
          <div
            className={`rounded-lg px-3 py-2 ${
              netTotal >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : "bg-rose-50 dark:bg-rose-950/30"
            }`}
          >
            <p
              className={`text-[11px] font-medium uppercase tracking-wide ${
                netTotal >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              Net
            </p>
            <p
              className={`mt-0.5 text-sm font-semibold tabular-nums ${
                netTotal >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              }`}
            >
              {netTotal >= 0 ? "+" : ""}
              {formatCurrency(netTotal)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        {filteredData.length === 0 ? (
          <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
            No transactions for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={filteredData}
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
              barCategoryGap="30%"
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={filteredData.length > 30 ? "preserveStartEnd" : 0}
              />
              <YAxis
                width={60}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCurrency(v)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted))", radius: 4, opacity: 0.1 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(value: string) =>
                  value.charAt(0).toUpperCase() + value.slice(1)
                }
              />
              <Bar
                dataKey="income"
                name="income"
                fill={INCOME_COLOR}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="expense"
                fill={EXPENSE_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountChart;

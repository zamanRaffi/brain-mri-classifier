"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, EmptyState } from "./ui";

const RESULT_COLORS: Record<string, string> = {
  "NO TUMOR": "#4edea3",
  GLIOMA: "#ba1a1a",
  MENINGIOMA: "#f59e0b",
  PITUITARY: "#0053db",
  INCONCLUSIVE: "#8a8f9c",
};

export function StatisticsCharts({
  tumorDistribution,
  monthlyReports,
}: {
  tumorDistribution: { name: string; value: number }[];
  monthlyReports: { month: string; reports: number }[];
}) {
  const hasDistribution = tumorDistribution.some((d) => d.value > 0);
  const hasMonthly = monthlyReports.some((m) => m.reports > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-on-surface mb-4">
          Tumor Distribution
        </h2>
        {hasDistribution ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={tumorDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {tumorDistribution.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={RESULT_COLORS[entry.name] ?? "#004ac6"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-container-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="pie_chart" message="No predictions yet to chart." />
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-on-surface mb-4">
          Monthly Reports
        </h2>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyReports}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-outline-variant)"
                opacity={0.4}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-container-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="reports" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="bar_chart" message="No reports in the last 6 months." />
        )}
      </Card>
    </div>
  );
}

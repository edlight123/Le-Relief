"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";

interface ChartData {
  label: string;
  value: number;
}

interface AnalyticsChartsProps {
  viewsData: ChartData[];
  publishedData: ChartData[];
}

export default function AnalyticsCharts({
  viewsData,
  publishedData,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Vues dans le temps */}
      <Card>
        <CardHeader>
          <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
            Vues dans le temps
          </h3>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border-subtle"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: "2px",
                    fontSize: "13px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Vues"
                  stroke="var(--accent-blue)"
                  strokeWidth={2}
                  dot={{ fill: "var(--accent-blue)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Articles publiés */}
      <Card>
        <CardHeader>
          <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
            Articles publiés
          </h3>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={publishedData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border-subtle"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: "2px",
                    fontSize: "13px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Publiés"
                  fill="var(--accent-teal)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

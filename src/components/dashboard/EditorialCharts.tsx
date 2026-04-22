"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "var(--color-primary, #c0392b)",
  "var(--color-accent-teal, #16a34a)",
  "var(--color-accent-blue, #2563eb)",
  "var(--color-accent-amber, #d97706)",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface KVData {
  name: string;
  value: number;
}

interface WeeklyData {
  week: string;
  count: number;
}

export function ContentTypePieChart({ data }: { data: KVData[] }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={false}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({ data }: { data: KVData[] }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
          <Tooltip />
          <Bar dataKey="value" fill="var(--color-primary, #c0392b)" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyVelocityChart({ data }: { data: WeeklyData[] }) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            name="Articles publiés"
            stroke="var(--color-primary, #c0392b)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DailyData {
  date: string;
  count: number;
}

export function DailyPublicationChart({ data }: { data: DailyData[] }) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval={Math.max(Math.floor(data.length / 7) - 1, 0)}
          />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="count"
            name="Publiés"
            fill="var(--color-primary, #c0392b)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PipelineStage {
  stage: string;
  hours: number;
}

export function PipelineTimingChart({ data }: { data: PipelineStage[] }) {
  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
          <XAxis type="number" tick={{ fontSize: 11 }} unit="h" />
          <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={130} />
          <Tooltip formatter={(v) => [`${v}h`, "Délai moyen"]} />
          <Bar
            dataKey="hours"
            fill="var(--color-accent-blue, #2563eb)"
            radius={[0, 3, 3, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrafficLanguageBar({ frViews, enViews }: { frViews: number; enViews: number }) {
  const data = [
    { name: "Français", value: frViews },
    { name: "English", value: enViews },
  ];
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="var(--color-accent-blue, #2563eb)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

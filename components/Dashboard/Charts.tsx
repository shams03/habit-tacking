"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

type LinePoint = { date: string; score: number };
type PieSlice = { name: string; value: number };

type Props = {
  lineData: LinePoint[];
  pieData: PieSlice[];
};

const PIE_COLORS = [
  "#6366f1", "#22d3ee", "#4ade80", "#fb923c",
  "#f472b6", "#94a3b8", "#a78bfa", "#34d399"
];

export default function Charts({ lineData, pieData }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Alignment Trend
        </h3>
        {lineData.length === 0 ? (
          <div className="h-[180px] rounded-xl border border-slate-700/60 bg-slate-900/50 flex items-center justify-center">
            <p className="text-sm text-slate-500 italic">No entries yet.</p>
          </div>
        ) : (
          <div className="h-[180px] rounded-xl border border-slate-700/60 bg-slate-900/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[-10, 10]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#a5b4fc" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Time Allocation
        </h3>
        {pieData.length === 0 ? (
          <div className="h-[200px] rounded-xl border border-slate-700/60 bg-slate-900/50 flex items-center justify-center">
            <p className="text-sm text-slate-500 italic">No activity data yet.</p>
          </div>
        ) : (
          <div className="h-[200px] rounded-xl border border-slate-700/60 bg-slate-900/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12
                  }}
                  formatter={(val: number) => [`${val} min`]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

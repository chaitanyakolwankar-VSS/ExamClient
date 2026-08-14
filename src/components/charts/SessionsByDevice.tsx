import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DeviceData {
  name: string;
  value: number;
}

const deviceData: DeviceData[] = [
  {
    name: "Pass",
    value: 16,
  },
  {
    name: "Fail",
    value: 14,
  },
];

const COLORS = [
  "#353CF2", // Desktop
  "#718CF5", // Mobile
  "#D7E3FA", // Tablet
];

const SessionsByDevice: React.FC = () => {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Sessions By Device
        </h2>

        {/* Three dots */}
        <button
          type="button"
          aria-label="More options"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Donut Chart */}
      <div className="mt-6 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={deviceData}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={120}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {deviceData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#353CF2]" />
          <span>Desktop</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#718CF5]" />
          <span>Mobile</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#D7E3FA]" />
          <span>Tablet</span>
        </div>
      </div>
    </div>
  );
};

export default SessionsByDevice;

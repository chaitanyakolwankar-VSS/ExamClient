import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DeliveryData {
  month: string;
  shipment: number;
  delivery: number;
}

const deliveryData: DeliveryData[] = [
  { month: "Jan", shipment: 78, delivery: 89 },
  { month: "Feb", shipment: 58, delivery: 49 },
  { month: "Mar", shipment: 68, delivery: 63 },
  { month: "Apr", shipment: 38, delivery: 24 },
  { month: "May", shipment: 63, delivery: 76 },
  { month: "Jun", shipment: 43, delivery: 66 },
  { month: "Jul", shipment: 47, delivery: 73 },
  { month: "Aug", shipment: 54, delivery: 89 },
  { month: "Sep", shipment: 56, delivery: 29 },
  { month: "Oct", shipment: 49, delivery: 68 },
  { month: "Nov", shipment: 65, delivery: 89 },
  { month: "Dec", shipment: 73, delivery: 94 },
];

const DeliveryStatistics: React.FC = () => {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Statistics
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Total number of deliveries{" "}
            <span className="text-gray-700">70.5K</span>
          </p>
        </div>

        {/* Monthly Dropdown */}
        <button
          type="button"
          className="flex items-center gap-7 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm"
        >
          <span>Monthly</span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#BFD4FF]" />
          <span>Shipment</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#435CFF]" />
          <span>Delivery</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={deliveryData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 0,
            }}
            barGap={4}
          >
            {/* Horizontal grid lines */}
            <CartesianGrid vertical={false} stroke="#EEF1F5" />

            {/* Months */}
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: "#263238",
              }}
              dy={10}
            />

            {/* Percentage */}
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
              tick={{
                fontSize: 12,
                fill: "#263238",
              }}
              width={45}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{
                fill: "rgba(67, 92, 255, 0.04)",
              }}
              formatter={(value, name) => [
                `${value}%`,
                name === "shipment" ? "Shipment" : "Delivery",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />

            {/* Shipment */}
            <Bar
              dataKey="shipment"
              fill="#BFD4FF"
              radius={[5, 5, 0, 0]}
              maxBarSize={15}
            />

            {/* Delivery */}
            <Bar
              dataKey="delivery"
              fill="#435CFF"
              radius={[5, 5, 0, 0]}
              maxBarSize={15}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DeliveryStatistics;

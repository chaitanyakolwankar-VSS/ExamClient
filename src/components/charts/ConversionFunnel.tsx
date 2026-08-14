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

interface ConversionData {
  month: string;
  adImpression: number;
  websiteSession: number;
  appDownload: number;
  newUsers: number;
}

const conversionData: ConversionData[] = [
  {
    month: "Jan",
    adImpression: 44,
    websiteSession: 13,
    appDownload: 11,
    newUsers: 21,
  },
  {
    month: "Feb",
    adImpression: 55,
    websiteSession: 23,
    appDownload: 17,
    newUsers: 8,
  },
  {
    month: "Mar",
    adImpression: 41,
    websiteSession: 21,
    appDownload: 15,
    newUsers: 25,
  },
  {
    month: "Apr",
    adImpression: 67,
    websiteSession: 8,
    appDownload: 15,
    newUsers: 13,
  },
  {
    month: "May",
    adImpression: 21,
    websiteSession: 19,
    appDownload: 16,
    newUsers: 22,
  },
  {
    month: "Jun",
    adImpression: 43,
    websiteSession: 27,
    appDownload: 14,
    newUsers: 8,
  },
  {
    month: "Jul",
    adImpression: 55,
    websiteSession: 13,
    appDownload: 18,
    newUsers: 18,
  },
  {
    month: "Aug",
    adImpression: 41,
    websiteSession: 23,
    appDownload: 20,
    newUsers: 20,
  },
];

const ConversionFunnel: React.FC = () => {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Conversion Funnel
        </h2>

        {/* Three dots */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="More options"
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

      {/* Legend */}
      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3038D8]" />
          <span>Ad Impression</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#455DF5]" />
          <span>Website Session</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#718CF5]" />
          <span>App Download</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#BFD2FA]" />
          <span>New Users</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={conversionData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 0,
            }}
            barSize={44}
          >
            {/* Grid */}
            <CartesianGrid vertical={false} stroke="#EEF1F5" />

            {/* X Axis */}
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

            {/* Y Axis */}
            <YAxis
              domain={[0, 120]}
              ticks={[0, 20, 40, 60, 80, 100, 120]}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: "#263238",
              }}
              width={35}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{
                fill: "rgba(67, 92, 255, 0.04)",
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />

            {/* Ad Impression */}
            <Bar dataKey="adImpression" stackId="conversion" fill="#3038D8" />

            {/* Website Session */}
            <Bar dataKey="websiteSession" stackId="conversion" fill="#455DF5" />

            {/* App Download */}
            <Bar dataKey="appDownload" stackId="conversion" fill="#718CF5" />

            {/* New Users */}
            <Bar
              dataKey="newUsers"
              stackId="conversion"
              fill="#BFD2FA"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConversionFunnel;

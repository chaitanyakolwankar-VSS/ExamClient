import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ExamLifecycleData {
  stage: string;
  students: number;
}

// DUMMY DATA — replace with backend API call later
const lifecycleData: ExamLifecycleData[] = [
  { stage: "Exam Created", students: 120 },
  { stage: "Students Assigned", students: 118 },
  { stage: "Seat No. Assigned", students: 115 },
  { stage: "Hall Ticket Released", students: 112 },
  { stage: "Marks Entry Done", students: 104 },
  { stage: "Gazette Generated", students: 96 },
  { stage: "Result Declared", students: 90 },
];

const ExamLifecycleChart: React.FC = () => {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Exam Lifecycle Progress
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Students moving through each exam stage
          </p>
        </div>
      </div>

      <div className="mt-5 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lifecycleData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#EEF1F5" />

            <XAxis
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#263238" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={70}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#263238" }}
              width={40}
            />

            <Tooltip
              cursor={{ stroke: "#435CFF", strokeDasharray: "4 4" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />

            <Legend wrapperStyle={{ fontSize: "13px" }} />

            <Line
              type="monotone"
              dataKey="students"
              name="Students"
              stroke="#435CFF"
              strokeWidth={2}
              dot={{ r: 4, fill: "#435CFF", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExamLifecycleChart;

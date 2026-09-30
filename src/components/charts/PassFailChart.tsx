import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  DashboardService,
  PassFailChartApiResponse,
} from "../../services/Dashboard";

interface PassFailChartProps {
  ayid?: string | null;
  courseId: string | null;
  activeSemester: string | null;
}

const COLORS = {
  Pass: "#353CF2",
  Fail: "#3a7bf3",
};

const PassFailChart: React.FC<PassFailChartProps> = ({
  ayid,
  courseId,
  activeSemester,
}) => {
  const [allData, setAllData] = useState<PassFailChartApiResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPassFailData = async () => {
    if (!courseId || !ayid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await DashboardService.GetPassFailChart({
        CourseId: courseId,
        Ayid: ayid,
      });
      setAllData(data);
    } catch (err) {
      console.error("Error fetching pass/fail chart data:", err);
      setError("Failed to load pass/fail data.");
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchPassFailData();
    } else {
      setAllData([]);
    }
  }, [courseId, ayid]);

  // Client-side filter — jo bhi semester select hoga wizard mein, wahi data yahan filter hoga
  const currentSemesterData = allData.find(
    (item) => item.semesterId === activeSemester,
  );

  const chartData = currentSemesterData
    ? [
        { name: "Pass", value: currentSemesterData.passCount },
        { name: "Fail", value: currentSemesterData.failCount },
      ]
    : [];

  const totalStudents = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Pass / Fail {activeSemester ? `— ${activeSemester}` : ""}
        </h2>
      </div>

      <div className="mt-6 h-[280px] w-full">
        {!courseId || !activeSemester ? (
          <p className="text-sm text-gray-500 text-center pt-16">
            Select a semester to view pass/fail data.
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-500 text-center pt-16">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center pt-16">{error}</p>
        ) : totalStudents === 0 ? (
          <p className="text-sm text-gray-500 text-center pt-16">
            No pass/fail data available for this semester.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={120}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name as "Pass" | "Fail"]}
                  />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <tspan
                  x="50%"
                  dy="-6"
                  className="fill-gray-900"
                  style={{ fontSize: "28px", fontWeight: 700 }}
                >
                  {totalStudents}
                </tspan>
                <tspan
                  x="50%"
                  dy="24"
                  className="fill-gray-500"
                  style={{ fontSize: "13px", fontWeight: 500 }}
                >
                  Total Students
                </tspan>
              </text>
              <Tooltip
                formatter={(value, name) => [`${value} students`, name]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {totalStudents > 0 && (
        <div className="mt-2 flex items-center justify-center gap-5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#353CF2]" />
            <span>Pass ({currentSemesterData?.passCount})</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D7E3FA]" />
            <span>Fail ({currentSemesterData?.failCount})</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassFailChart;

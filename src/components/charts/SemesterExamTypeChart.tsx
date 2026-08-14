import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  DashboardService,
  SemesterExamTypeCountApiResponse,
} from "../../services/Dashboard";

interface SemesterExamTypeChartProps {
  courseId: string | null;
}

interface PivotedData {
  semesterId: string;
  Regular: number;
  Reval: number;
  ATKT: number;
}

const SemesterExamTypeChart: React.FC<SemesterExamTypeChartProps> = ({
  courseId,
}) => {
  const [rawData, setRawData] = useState<SemesterExamTypeCountApiResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const ayid = localStorage.getItem("AYID");
    if (!courseId || !ayid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await DashboardService.GetSemesterWiseExamTypeCount({
        CourseId: courseId,
        Ayid: ayid,
      });
      setRawData(data);
    } catch (err) {
      console.error("Error fetching semester exam type count:", err);
      setError("Failed to load data.");
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    } else {
      setRawData([]);
    }
  }, [courseId]);

  // Pivot: flat rows -> grouped by semester with Regular/Reval/ATKT columns
  const pivotedData: PivotedData[] = React.useMemo(() => {
    const map = new Map<string, PivotedData>();

    rawData.forEach((row) => {
      if (!map.has(row.semesterId)) {
        map.set(row.semesterId, {
          semesterId: row.semesterId,
          Regular: 0,
          Reval: 0,
          ATKT: 0,
        });
      }
      const entry = map.get(row.semesterId)!;

      // ExamType string match karo apne DB ke actual values ke hisaab se
      if (row.examType === "Regular") entry.Regular = row.studentCount;
      else if (row.examType === "Reval") entry.Reval = row.studentCount;
      else if (row.examType === "ATKT") entry.ATKT = row.studentCount;
    });

    // Semester-wise sorted order chahiye to yahan sort kar sakte ho
    return Array.from(map.values()).sort((a, b) =>
      a.semesterId.localeCompare(b.semesterId),
    );
  }, [rawData]);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Semester-wise Exam Type Distribution
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Regular, Reval &amp; ATKT student count per semester
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#BFD4FF]" />
          <span>Regular</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#435CFF]" />
          <span>Reval</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00AFC0]" />
          <span>ATKT</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[280px] w-full">
        {!courseId ? (
          <p className="text-sm text-gray-500 text-center pt-16">
            Select a course to view semester-wise exam type data.
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-500 text-center pt-16">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center pt-16">{error}</p>
        ) : pivotedData.length === 0 ? (
          <p className="text-sm text-gray-500 text-center pt-16">
            No data available for this course.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pivotedData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid vertical={false} stroke="#EEF1F5" />

              <XAxis
                dataKey="semesterId"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#263238" }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#263238" }}
                width={40}
              />

              <Tooltip
                cursor={{ fill: "rgba(67, 92, 255, 0.04)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />

              <Bar
                dataKey="Regular"
                fill="#BFD4FF"
                radius={[5, 5, 0, 0]}
                maxBarSize={15}
              />
              <Bar
                dataKey="Reval"
                fill="#435CFF"
                radius={[5, 5, 0, 0]}
                maxBarSize={15}
              />
              <Bar
                dataKey="ATKT"
                fill="#00AFC0"
                radius={[5, 5, 0, 0]}
                maxBarSize={15}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SemesterExamTypeChart;

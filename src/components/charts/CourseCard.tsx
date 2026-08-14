import React from "react";

interface CourseCardProps {
  courseName: string;
  studentCount: number;
}

const CourseCard: React.FC<CourseCardProps> = ({
  courseName,
  studentCount,
}) => {
  return (
    <div className="flex w-full items-center gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100">
        <span className="text-base font-semibold text-[#17213F]">
          {studentCount}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-xl font-semibold uppercase leading-tight text-[#17213F]">
          {courseName}
        </h3>
      </div>
    </div>
  );
};

export default CourseCard;

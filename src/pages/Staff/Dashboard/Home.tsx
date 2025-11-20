// Notice we use "../../../" to go up 3 levels: Dashboard -> Staff -> pages -> src
import PageMeta from "../../../components/common/PageMeta"; 

export default function ExamDashboard() {
  return (
    <>
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
             <h2 className="text-lg font-bold text-gray-800 dark:text-white">Staff Portal</h2>
             <p className="mt-2 text-gray-500">
               Welcome to the Exam Management System. This is the secure area for staff members.
             </p>
        </div>
      </div>
    </>
  );
}
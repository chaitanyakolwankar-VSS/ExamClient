import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import Badge from "../../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { platformErrorMessage, platformService } from "../../services/platformService";
import type { PlatformCollegeListItem } from "../../services/platformService";

const HEAD = "px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const CELL = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

export default function Colleges() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<PlatformCollegeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    platformService
      .getColleges()
      .then((rows) => {
        if (!cancelled) setColleges(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(platformErrorMessage(err, "Could not load the colleges."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageMeta title="GradeSphere | Platform" description="GradeSphere platform console" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Colleges</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Every college on the platform. Open one to manage its admins, branches and academic years.
          </p>
        </div>
        <Button startIcon={<Plus className="size-4" />} onClick={() => navigate("/Platform/colleges/new")}>
          New college
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      <ComponentCard title={colleges ? `${colleges.length} college${colleges.length === 1 ? "" : "s"}` : "Loading..."}>
        {colleges && colleges.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No colleges yet. Use "New college" to create the first one.</p>
        )}
        {colleges && colleges.length > 0 && (
          <div className="-mx-2 overflow-x-auto sm:mx-0">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className={HEAD}>College</TableCell>
                  <TableCell isHeader className={HEAD}>Code</TableCell>
                  <TableCell isHeader className={HEAD}>Admins</TableCell>
                  <TableCell isHeader className={HEAD}>Branches</TableCell>
                  <TableCell isHeader className={HEAD}>Current year</TableCell>
                  <TableCell isHeader className={HEAD}>Branding</TableCell>
                  <TableCell isHeader className={HEAD}>
                    <span className="sr-only">Open</span>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {colleges.map((c) => (
                  <TableRow
                    key={c.collegeId}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <TableCell className={`${CELL} font-medium text-gray-800 dark:text-white/90`}>{c.name}</TableCell>
                    <TableCell className={CELL}>{c.collegeCode}</TableCell>
                    <TableCell className={CELL}>
                      <Badge size="sm" color={c.adminCount === 0 ? "warning" : "success"}>
                        {c.adminCount}
                      </Badge>
                    </TableCell>
                    <TableCell className={CELL}>{c.branchCount}</TableCell>
                    <TableCell className={CELL}>{c.currentAcademicYear ?? "-"}</TableCell>
                    <TableCell className={CELL}>
                      <div className="flex gap-1.5">
                        <Badge size="sm" color={c.hasLogo ? "success" : "light"}>Logo</Badge>
                        <Badge size="sm" color={c.hasBanner ? "success" : "light"}>Banner</Badge>
                      </div>
                    </TableCell>
                    <TableCell className={`${CELL} text-right`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-3 py-1.5"
                        onClick={() => navigate(`/Platform/colleges/${c.collegeId}`)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>
    </>
  );
}

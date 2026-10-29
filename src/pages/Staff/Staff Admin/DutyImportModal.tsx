import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { Modal } from "../../../components/ui/modal";
import { DutyChartService } from "../../../services/StaffLetterService";
import type { DutyImportResult } from "../../../services/StaffLetterService";
import type { StudentImportResult } from "../../../services/Student_MasterService";
import SheetImportPanel from "../Students Admin/SheetImportPanel";
import { fullDate } from "./dutyModel";
import { apiReason } from "./letterHelpers";

interface Props {
  chartId: string;
  chartName: string;
  /** yyyy-MM-dd, printed on the letters this import makes. */
  letterDate: string;
  onClose: () => void;
  /** After the file was saved: the chart and its letters changed. */
  onImported: () => void;
}

const ACTION_TEXT: Record<string, string> = { New: "New duties.", Update: "Duties change." };

/** The import result in the shape the shared sheet panel shows (New / Update = OK, with what changes). */
const asSheetResult = (r: DutyImportResult): StudentImportResult => ({
  success: r.success,
  saved: r.saved,
  message: r.message,
  errors: r.errors,
  rows: r.rows.map((x) => ({
    row: x.row,
    studentId: null,
    name: x.name,
    email: "",
    status: x.hasErrors ? "Error" : x.action === "Unchanged" ? "Unchanged" : "OK",
    note: [x.hasErrors ? "" : (ACTION_TEXT[x.action] ?? ""), x.note ?? ""].filter(Boolean).join(" ") || null,
  })),
});

/** Import Excel: download the chart, fill it in, upload; each row is checked first and Save replaces the chart with the file. */
export default function DutyImportModal({ chartId, chartName, letterDate, onClose, onImported }: Props) {
  return (
    <Modal isOpen onClose={onClose} className="m-4 max-w-[1000px]">
      <div role="dialog" aria-modal="true" aria-label="Import people and duties from Excel" className="@container">
        <div className="px-5 pb-0 pt-5 pr-14 sm:px-6 sm:pt-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Import Excel</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            For <b className="font-medium text-gray-700 dark:text-gray-300">{chartName}</b>. The people in the file become the people on duty, with the duties written in it; anyone not in the file is taken off. This is saved at once. New letters are dated {letterDate ? fullDate(letterDate) : "—"}.
          </p>
        </div>
        <SheetImportPanel
          steps={[
            { title: "Download the sheet", text: "It lists the people already on this exam period and the days, with the duties saved so far. With nobody added yet it is a blank sheet: add rows with each person's Employee ID." },
            {
              title: "Fill it in",
              text: (
                <>
                  Under each day write <b>M</b> (morning), <b>A</b> (afternoon) or <b>M/A</b> (both). Put <b>CC</b> (Chief Conductor) or <b>SS</b> (Senior Supervisor) in front, for example CC M/A. <b>V</b> is a valuation day; any other text is other work.
                </>
              ),
            },
            { title: "Upload it", text: "Each row is checked first. Nothing is saved until you press Save, which also makes or updates the letters." },
          ]}
          downloadLabel="Download sheet"
          onDownload={async () => {
            try {
              const { blob, fileName } = await DutyChartService.excel(chartId);
              saveAs(blob, fileName);
            } catch (err) {
              Swal.fire("Supervision letters", apiReason(err, "The sheet could not be made."), "error");
            }
          }}
          upload={async (file, preview) => {
            const result = asSheetResult(await DutyChartService.importSheet(chartId, file, preview, letterDate));
            if (result.saved) onImported();
            return result;
          }}
          saveLabel="Save"
          ready={() => {
            if (letterDate) return true;
            Swal.fire("Supervision letters", "Choose the letter date first.", "info");
            return false;
          }}
          reason={apiReason}
        />
      </div>
    </Modal>
  );
}

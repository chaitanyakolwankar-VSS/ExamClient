import ExcelJS from "exceljs";

/** A cell as the import screens use it: formulas give their result, rich text and links their text. */
export type ExcelCell = string | number | boolean | null;

const plain = (value: ExcelJS.CellValue): ExcelCell => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("result" in value) return plain(value.result as ExcelJS.CellValue); // formula
    if ("richText" in value) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return String(value.text); // hyperlink
  }
  return null; // error cells and anything unknown
};

const readFirstSheet = async (file: Blob): Promise<ExcelJS.Worksheet | undefined> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  return workbook.worksheets[0];
};

/**
 * The first worksheet of an .xlsx file as rows of cells (row 1 = index 0, column A = index 0; empty cells
 * are left out of the array). Only .xlsx is read -- the screens import the templates they themselves produce.
 */
export const readExcelRows = async (file: Blob): Promise<ExcelCell[][]> => {
  const sheet = await readFirstSheet(file);
  if (!sheet) return [];
  const rows: ExcelCell[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values: ExcelCell[] = [];
    row.eachCell((cell, colNumber) => {
      values[colNumber - 1] = plain(cell.value);
    });
    rows[rowNumber - 1] = values;
  });
  return Array.from(rows, (r) => r ?? []);
};

/** The first worksheet as one object per row, keyed by the first row's headings; empty rows are skipped. */
export const readExcelObjects = async (file: Blob): Promise<Record<string, ExcelCell>[]> => {
  const [headings = [], ...rows] = await readExcelRows(file);
  return rows
    .filter((r) => r.some((v) => v !== null && v !== undefined && v !== ""))
    .map((r) => {
      const item: Record<string, ExcelCell> = {};
      headings.forEach((h, i) => {
        if (h !== null && h !== undefined && h !== "" && r[i] !== undefined && r[i] !== null) item[String(h)] = r[i];
      });
      return item;
    });
};

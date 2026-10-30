// HTML for the attendance report prints (attendance sheet, seating arrangement, packing slip).
// Kept apart from the screen so the sheet layout can be checked on its own.

/** Students on one sheet (two columns of 20). A bigger block is allowed and carries on to a second page. */
export const MAX_STUDENTS_PER_BLOCK = 40;
const ROWS_PER_HALF = MAX_STUDENTS_PER_BLOCK / 2;

export const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

// ============================================================
// SEMESTER / DATE TEXT
// ============================================================

const ROMAN_NUMERALS: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export const toRoman = (n: number): string => {
  let rest = n;
  let out = "";
  for (const [value, symbol] of ROMAN_NUMERALS) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
};

/** "Semester VII" from the semester option (label "Semester VII", value "Sem-7"). */
export const semesterText = (label: string | undefined, value: string): string => {
  const fromLabel = (label ?? "").trim();
  if (/^semester\s+\S+/i.test(fromLabel)) return fromLabel;
  const digits = /(\d+)/.exec(value);
  if (digits) return `Semester ${toRoman(Number(digits[1]))}`;
  return `Semester ${fromLabel || value}`;
};

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/** "15-12-2026" (or 15/12/2026, 2026-12-15) becomes "15 DECEMBER 2026"; anything else is printed as it is. */
export const longDate = (date: string): string => {
  const text = (date ?? "").trim();
  let day = 0;
  let month = 0;
  let year = 0;
  let m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(text);
  if (m) {
    day = Number(m[1]);
    month = Number(m[2]);
    year = Number(m[3]);
  } else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text))) {
    year = Number(m[1]);
    month = Number(m[2]);
    day = Number(m[3]);
  }
  if (!day || month < 1 || month > 12) return text;
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
};

// ============================================================
// HEADER (banner or college name, then the centre line)
// ============================================================

export interface PrintHeader {
  bannerDataUrl: string | null;
  collegeName: string;
  collegeCenter: string;
}

export const buildHeaderHtml = (h: PrintHeader): string => {
  const name = h.collegeName.trim();
  const centre = h.collegeCenter.trim();
  const centreLine = name && centre ? `${name}, ${centre}` : name || centre;
  const top = h.bannerDataUrl
    ? `<div class="college-banner"><img src="${escapeHtml(h.bannerDataUrl)}" alt="${escapeHtml(name || "College banner")}" /></div>`
    : name
      ? `<div class="college-name">${escapeHtml(name)}</div>`
      : "";
  const centreHtml = centreLine
    ? `<div class="centre-line"><strong>Center Name:</strong> ${escapeHtml(centreLine)}</div>`
    : "";
  return `<div class="print-header">${top}${centreHtml}</div>`;
};

export const HEADER_CSS = `
  .print-header {
    width: 100%;
    text-align: center;
  }

  .college-banner {
    width: 100%;
    padding: 4px 6px;
    text-align: center;
  }

  .college-banner img {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 24mm;
    object-fit: contain;
    margin: 0 auto;
  }

  .college-name {
    padding: 6px 6px 2px;
    font-size: 16pt;
    font-weight: bold;
    line-height: 1.2;
  }

  .centre-line {
    padding: 3px 6px;
    font-size: 11pt;
    line-height: 1.2;
    border-top: 1px solid #000;
  }
`;

// ============================================================
// PAPER WISE ATTENDANCE SHEET AND SUPERVISOR REPORT
// ============================================================

export interface SheetBlock {
  blockName: string;
  /** Seat numbers of this block, in order. Over 40 carries on to more pages (Sr. No. continues). */
  seatNos: string[];
}

export interface AttendanceSheetInput {
  headerHtml: string;
  /** Second title line, e.g. "B.E (C Scheme)-December 2026 (Regular)-COMPUTER ENGINEERING-Semester VII[COPCC701]". */
  title: string;
  subjectName: string;
  subjectCode: string;
  date: string;
  time: string;
  blocks: SheetBlock[];
}

const cell = (html: string, cls = ""): string =>
  `<td${cls ? ` class="${cls}"` : ""}>${html}</td>`;

const row = (cells: string[], cls = ""): string =>
  `<table class="r${cls ? ` ${cls}` : ""}"><tbody><tr>${cells.join("")}</tr></tbody></table>`;

/** One page of seat rows: `seatNos` is this page's part (up to 40); Sr. No. starts after `offset`. */
const sheetRows = (seatNos: string[], offset: number): string => {
  const out: string[] = [];
  for (let i = 0; i < ROWS_PER_HALF; i++) {
    const left = seatNos[i];
    const right = seatNos[i + ROWS_PER_HALF];
    out.push(`
      <tr>
        <td class="sr">${left !== undefined ? offset + i + 1 : "--"}</td>
        <td class="seat">${left !== undefined ? escapeHtml(left) : ""}</td>
        <td></td>
        <td></td>
        <td class="sr mid">${right !== undefined ? offset + i + ROWS_PER_HALF + 1 : "--"}</td>
        <td class="seat">${right !== undefined ? escapeHtml(right) : ""}</td>
        <td></td>
        <td></td>
      </tr>`);
  }
  return out.join("");
};

/**
 * One page of a block. A block of up to 40 is one page; a bigger one carries on to more pages: every page repeats the
 * header and the block's details (whole-block count and seat range, "Page 2 of 2"), the Sr. No. continues, and the
 * declaration, totals and signatures come once, on the block's last page.
 */
const sheetHtml = (input: AttendanceSheetInput, block: SheetBlock, page: number, pages: number): string => {
  const count = block.seatNos.length;
  const first = block.seatNos[0] ?? "--";
  const last = block.seatNos[count - 1] ?? "--";
  const offset = page * MAX_STUDENTS_PER_BLOCK;
  const pageSeats = block.seatNos.slice(offset, offset + MAX_STUDENTS_PER_BLOCK);
  const lastPage = page === pages - 1;
  const pageNote = pages > 1 ? ` &nbsp;&nbsp; <strong>Page ${page + 1} of ${pages}</strong>` : "";

  return `
    <section class="sheet">
      <div class="box">
        ${input.headerHtml}

        <div class="title-box">
          <div class="title-1">Paper Wise Attendance Sheet and Supervisor Report For</div>
          <div class="title-2">${escapeHtml(input.title)}</div>
        </div>

        ${row([
          cell(`<strong>Paper :</strong> ${escapeHtml(input.subjectName)} (${escapeHtml(input.subjectCode)})`),
          cell(`<strong>Total Student Count :</strong> ${count}`),
        ])}
        ${row([
          cell(
            `<strong>Block Name :</strong> ${escapeHtml(block.blockName)}${pageNote} &nbsp;&nbsp; <strong>Date &amp; Time :</strong> ${escapeHtml(longDate(input.date))} &amp; ${escapeHtml(input.time)}`
          ),
          cell(`<strong>Seat No. From :</strong>${escapeHtml(first)} <strong>To :</strong> ${escapeHtml(last)}`),
        ])}
        ${row([cell("<strong>Supervisor Name :</strong>"), cell("<strong>Signature :</strong>")], "tall")}

        <table class="grid">
          <colgroup>
            <col style="width:7%" /><col style="width:17%" /><col style="width:13%" /><col style="width:13%" />
            <col style="width:7%" /><col style="width:17%" /><col style="width:13%" /><col style="width:13%" />
          </colgroup>
          <thead>
            <tr>
              <th>Sr. No.</th><th>Seat No</th><th>A/B No.</th><th>Signature</th>
              <th class="mid">Sr. No.</th><th>Seat No</th><th>A/B No.</th><th>Signature</th>
            </tr>
          </thead>
          <tbody>${sheetRows(pageSeats, offset)}</tbody>
        </table>
${lastPage ? `
        <div class="declaration">Declaration by Jr. Supervisor: I have verified the Seat No. of all the students on each answer sheet submitted by each student in the block and tallies with number allotted by the University/College.</div>

        ${row([
          cell("<strong>Total Present Students:</strong>"),
          cell("<strong>Total Absent Students:</strong>"),
          cell(`<strong>Total No. of Students in block:</strong> ${count}`),
        ])}
        ${row([cell("<strong>Absent Seat No.</strong>"), cell(""), cell(""), cell("")], "absent")}
        ${row([cell(""), cell(""), cell(""), cell("")], "absent")}
        ${row(
          [
            cell("<strong>Checked By:</strong>"),
            cell("<strong>Sr. Supervisor(Sign/Name):</strong>"),
            cell("<strong>Jr. Supervisor(Sign/Name):</strong>"),
          ],
          "sign"
        )}` : `
        <div class="declaration">Continued on the next page (Block ${escapeHtml(block.blockName)}, page ${page + 2} of ${pages}).</div>`}
      </div>
    </section>`;
};

/** All pages of one block (one page per 40 students, at least one). */
const blockPages = (input: AttendanceSheetInput, block: SheetBlock): string => {
  const pages = Math.max(1, Math.ceil(block.seatNos.length / MAX_STUDENTS_PER_BLOCK));
  return Array.from({ length: pages }, (_, page) => sheetHtml(input, block, page, pages)).join("");
};

export const buildAttendanceSheetDocument = (input: AttendanceSheetInput): string => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Paper Wise Attendance Sheet and Supervisor Report</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 6mm;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        color: #000;
        background: #fff;
        font-family: "Times New Roman", Times, serif;
        font-size: 11pt;
      }

      .sheet {
        width: 198mm;
        margin: 0 auto 8mm;
      }

      .box {
        border: 1px solid #000;
      }

      ${HEADER_CSS}

      .title-box {
        border-top: 1px solid #000;
        text-align: center;
        padding: 3px 6px;
        line-height: 1.25;
      }

      .title-1 {
        font-size: 12pt;
        font-weight: bold;
      }

      .title-2 {
        font-size: 11pt;
        font-weight: bold;
      }

      table.r {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border-top: 1px solid #000;
      }

      table.r td {
        border-left: 1px solid #000;
        padding: 2px 6px;
        height: 7.5mm;
        font-size: 11pt;
        vertical-align: middle;
        overflow-wrap: anywhere;
      }

      table.r td:first-child {
        border-left: none;
      }

      table.r.tall td { height: 10mm; }
      table.r.absent td { height: 9mm; }
      table.r.sign td { height: 17mm; vertical-align: top; padding-top: 3px; }

      table.grid {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border-top: 1px solid #000;
      }

      table.grid th,
      table.grid td {
        border: 1px solid #000;
        height: 6.6mm;
        padding: 0 3px;
        text-align: center;
        font-size: 11pt;
        line-height: 1;
        overflow: hidden;
        white-space: nowrap;
      }

      table.grid th {
        font-weight: bold;
        height: 7mm;
      }

      table.grid td.seat {
        font-weight: bold;
      }

      table.grid .mid {
        border-left: 2px solid #000;
      }

      table.grid tr > :first-child { border-left: none; }
      table.grid tr > :last-child { border-right: none; }

      .declaration {
        border-top: 1px solid #000;
        padding: 3px 6px;
        text-align: center;
        font-weight: bold;
        font-size: 10.5pt;
        line-height: 1.25;
      }

      @media print {
        .sheet {
          margin: 0 auto;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }
      }
    </style>
  </head>
  <body>
    ${input.blocks.map((b) => blockPages(input, b)).join("")}
  </body>
</html>`;

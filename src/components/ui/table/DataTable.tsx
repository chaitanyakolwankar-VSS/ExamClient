import React, { useState, useMemo, useEffect } from "react";
import Input from "../../form/input/InputField";

type RenderResult = {
  content?: React.ReactNode;
  rowSpan?: number;
  colSpan?: number;
  skip?: boolean;
};

interface Column<T = any> {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  group?: boolean;
  render?: (row: T) => React.ReactNode | RenderResult;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: string[];
  filters?: Record<string, any>;
  pageSizeOptions?: number[];
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  searchKeys = [],
  filters = {},
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);

  // FILTER + SEARCH + SORT
  const filteredData = useMemo(() => {
    let result = [...data];

    // Custom Filters
    for (let key in filters) {
      const value = filters[key];
      if (value !== undefined && value !== "" && value !== null) {
        result = result.filter((row) =>
          String(row[key]).toLowerCase() === String(value).toLowerCase()
        );
      }
    }

    // Search
    if (search && searchKeys.length > 0) {
      result = result.filter((row) =>
        searchKeys.some((key) =>
          String(row[key]).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Sorting
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortable && !col.group) {
        result.sort((a, b) => {
          const valA = a[sortKey];
          const valB = b[sortKey];
          if (valA < valB) return sortOrder === "asc" ? -1 : 1;
          if (valA > valB) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [data, filters, search, sortKey, sortOrder, searchKeys, columns]);

  // Detect if rowSpan grouping exists on ANY visible row
  const hasSpans = useMemo(() => {
    if (!filteredData.length) return false;

    return filteredData.some((row) =>
      columns.some((col) => {
        if (typeof col.render !== "function") return false;

        const result = col.render(row);

        // If JSX/Primitive, skip
        if (React.isValidElement(result) || typeof result !== "object") {
          return false;
        }

        const r = result as RenderResult;
        return r.rowSpan !== undefined && r.rowSpan > 1;
      })
    );
  }, [filteredData, columns]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleSort = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable || col.group) return;

    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
      {/* SEARCH + ROW LIMIT */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="w-64">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {!hasSpans && (
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        )}
      </div>

      {/* TABLE */}
      <table className="w-full border border-gray-200 rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`border px-4 py-2 font-semibold text-left select-none ${
                  col.sortable === false ? "" : "cursor-pointer"
                } ${col.className || ""}`}
                onClick={() =>
                  col.sortable === false || col.group
                    ? null
                    : handleSort(col.key)
                }
              >
                {col.label}
                {sortKey === col.key && (sortOrder === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {(hasSpans ? filteredData : currentData).length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="border px-4 py-3 text-center text-gray-500"
              >
                No data found
              </td>
            </tr>
          ) : (
            (hasSpans ? filteredData : currentData).map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                {columns.map((col) => {
                  const result = col.render ? col.render(row) : row[col.key];
                  let cell: RenderResult;

                  if (
                    React.isValidElement(result) ||
                    typeof result !== "object"
                  ) {
                    cell = { content: result };
                  } else {
                    cell = result as RenderResult;
                  }

                  if (cell.skip) return null;

                  return (
                    <td
                      key={col.key}
                      rowSpan={cell.rowSpan || 1}
                      colSpan={cell.colSpan || 1}
                      className={`border px-4 py-2 align-middle ${col.className || ""}`}
                    >
                      {cell.content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PAGINATION */}
      {!hasSpans && totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="px-2 disabled:opacity-30"
            >
              ⏮
            </button>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-2 disabled:opacity-30"
            >
              ◀
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2 disabled:opacity-30"
            >
              ▶
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2 disabled:opacity-30"
            >
              ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

import React, { useState, useMemo } from "react";
import { 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Search 
} from "lucide-react";

// --- Types ---
export interface Column {
  header: string;
  accessor: string;      // The key inside the nested item
  className?: string;    // Custom CSS classes (e.g., width)
  isSortable?: boolean;  // Enable sorting for this column
}

interface GenericTableProps {
  data: any[];           // The array of grouped objects
  columns: Column[];     // Configuration for columns
  groupByKey: string;    // The key for the 'RowSpan' column (e.g., 'moduleName')
  nestedKey: string;     // The key containing the array of items (e.g., 'forms')
  onEdit?: (group: any, item: any) => void;   // Optional edit handler
  onDelete?: (id: string) => void;            // Optional delete handler
}

// --- Component ---
const GenericTable = ({ 
  data, 
  columns, 
  groupByKey, 
  nestedKey, 
  onEdit, 
  onDelete 
}: GenericTableProps) => {
  
  // State for Table Features
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // 1. Logic: Filter, Search, and Sort
  const processedData = useMemo(() => {
    let result = JSON.parse(JSON.stringify(data)); // Deep clone to avoid mutating original state

    // Filter by Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.map((group: any) => ({
        ...group,
        [nestedKey]: group[nestedKey].filter((item: any) =>
          Object.values(item).some(val => String(val).toLowerCase().includes(lowerSearch)) ||
          String(group[groupByKey]).toLowerCase().includes(lowerSearch)
        )
      })).filter((group: any) => group[nestedKey].length > 0);
    }

    // Sort by Group Key
    if (sortOrder) {
      result.sort((a: any, b: any) => {
        const valA = String(a[groupByKey]).toLowerCase();
        const valB = String(b[groupByKey]).toLowerCase();
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }
    return result;
  }, [data, searchTerm, sortOrder, groupByKey, nestedKey]);

  // 2. Logic: Pagination
  // Flatten the grouped data to count total "rows" (items inside groups)
  const totalItems = processedData.reduce((acc: number, g: any) => acc + g[nestedKey].length, 0);
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  
  // Slice the data for the current page
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    
    // Simple slice for grouping: This slices groups, not individual items. 
    // To slice individual items perfectly with grouping is complex, 
    // so we slice the groups for stability.
    return processedData.slice(start, end);
  }, [processedData, currentPage, rowsPerPage]);

  const showActions = !!onEdit || !!onDelete;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      
      {/* TOOLBAR: Search & Row Limit */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">Show</span>
          <select 
            className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm text-gray-500 font-medium">entries</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search everything..."
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider ${col.className}`}>
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.isSortable && (
                      <ArrowUpDown 
                        size={14} 
                        className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors" 
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      />
                    )}
                  </div>
                </th>
              ))}
              {showActions && <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((group: any) => (
                group[nestedKey].map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-gray-50/80 transition-colors">
                    {/* The Spanned Group Column */}
                    {index === 0 && (
                      <td 
                        rowSpan={group[nestedKey].length} 
                        className="px-4 py-3 text-sm font-semibold text-gray-900 border-r bg-white align-middle"
                      >
                        {group[groupByKey]}
                      </td>
                    )}
                    
                    {/* Dynamic Columns (skipping the first one as it is grouped) */}
                    {columns.slice(1).map((col, j) => (
                      <td key={j} className="px-4 py-3 text-sm text-gray-600">
                        {item[col.accessor] || "-"}
                      </td>
                    ))}

                    {/* Conditional Actions */}
                    {showActions && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {onEdit && (
                            <button 
                              onClick={() => onEdit(group, item)} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
                          {onDelete && (
                            <button 
                              onClick={() => onDelete(item.permissionId || item.id)} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-4 py-10 text-center text-gray-400 italic">
                  No data found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER: Pagination Info & Nav */}
      <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
        <span className="text-sm text-gray-500">
          Showing <span className="font-semibold">{totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-semibold">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of <span className="font-semibold">{totalItems}</span> entries
        </span>
        
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 border border-gray-300 rounded-md hover:bg-white disabled:opacity-40 transition-all shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium shadow-sm">
            Page {currentPage} of {totalPages || 1}
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 border border-gray-300 rounded-md hover:bg-white disabled:opacity-40 transition-all shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericTable;
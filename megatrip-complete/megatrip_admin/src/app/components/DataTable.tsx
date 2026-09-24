import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

export interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
  width?: string;
}

export interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
  };
  onPaginationChange?: (page: number, pageSize: number) => void;
  onSortChange?: (field: string, direction: "asc" | "desc" | null) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onSearch?: (query: string) => void;
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (keys: string[]) => void;
    getCheckboxProps?: (record: any) => { disabled?: boolean };
  };
  bulkActions?: {
    label: string;
    action: (selectedKeys: string[]) => void;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
  }[];
  actions?: {
    label: string;
    action: (record: any) => void;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
  }[];
  emptyState?: React.ReactNode;
  title?: string;
  description?: string;
  exportable?: boolean;
  onExport?: () => void;
  rowKey?: string; // <--- thêm dòng này
}

export function DataTable({
  columns,
  data,
  loading = false,
  pagination,
  onPaginationChange,
  onSortChange,
  onFilterChange,
  onSearch,
  rowSelection,
  bulkActions,
  actions,
  emptyState,
  title,
  description,
  exportable = false,
  onExport,
  rowKey = "id", // <--- mặc định là "id"
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  const hasSelection = rowSelection && rowSelection.selectedRowKeys.length > 0;

  const handleSort = (field: string) => {
    let newDirection: "asc" | "desc" | null = "asc";

    if (sortField === field) {
      if (sortDirection === "asc") {
        newDirection = "desc";
      } else if (sortDirection === "desc") {
        newDirection = null;
      }
    }

    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);
    onSortChange?.(field, newDirection);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Hiển thị {startItem} đến {endItem} trong tổng số {total} kết quả
          </p>
          {pagination.showSizeChanger && (
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPaginationChange?.(1, parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(1, pageSize)}
            disabled={current <= 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(current - 1, pageSize)}
            disabled={current <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (current <= 3) {
                pageNum = i + 1;
              } else if (current >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = current - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === current ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPaginationChange?.(pageNum, pageSize)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(current + 1, pageSize)}
            disabled={current >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(totalPages, pageSize)}
            disabled={current >= totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const allSelected =
    rowSelection &&
    data.length > 0 &&
    rowSelection.selectedRowKeys.length === data.length;
  const someSelected = rowSelection && rowSelection.selectedRowKeys.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Nhập tên để tìm kiếm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hover:bg-primary-600 hover:text-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button> */}
        </div>

        {/* <div className="flex items-center space-x-2">
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="hover:bg-primary-600 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất
            </Button>
          )}
        </div> */}
      </div>

      {/* Bulk Actions */}
      {hasSelection && bulkActions && (
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary">
            Đã chọn {rowSelection.selectedRowKeys.length} mục
          </span>
          <div className="flex items-center space-x-2">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === "destructive" ? "destructive" : "default"}
                size="sm"
                onClick={() => action.action(rowSelection.selectedRowKeys)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns
              .filter((col) => col.filterable)
              .map((column) => (
                <div key={column.key}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {column.title}
                  </label>
                  <Input
                    placeholder={`Lọc theo ${column.title.toLowerCase()}`}
                    value={filters[column.key] || ""}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {rowSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const keys = data.map((record, idx) =>
                          String(record[rowKey] ?? record.id ?? record.key ?? idx)
                        );
                        rowSelection.onChange(keys);
                      } else {
                        rowSelection.onChange([]);
                      }
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column, colIdx) => (
                <TableHead
                  key={column.key || colIdx}
                  className={cn(
                    "font-medium",
                    column.sortable && "cursor-pointer hover:bg-gray-50",
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="w-20">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${Date.now()}-${index}`}>
                  {rowSelection && (
                    <TableCell>
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  )}
                  {columns.map((column, colIdx) => (
                    <TableCell key={`loading-${column.key || colIdx}-${index}`}>
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (rowSelection ? 1 : 0) + (actions ? 1 : 0)
                  }
                  className="h-24"
                >
                  {emptyState || (
                    <div className="text-center text-gray-500">
                      <p>Không có dữ liệu</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((record, index) => (
                <TableRow key={record[rowKey] ?? record.id ?? record.key ?? `row-${index}`}>
                  {rowSelection && (
                    <TableCell>
                      <Checkbox
                        checked={rowSelection.selectedRowKeys.includes(
                          String(record[rowKey] ?? record.id ?? record.key ?? index)
                        )}
                        onCheckedChange={(checked) => {
                          const recordKey = String(record[rowKey] ?? record.id ?? record.key ?? index);
                          const newSelection = checked
                            ? [...rowSelection.selectedRowKeys, recordKey]
                            : rowSelection.selectedRowKeys.filter((key) => key !== recordKey);
                          rowSelection.onChange(newSelection);
                        }}
                        {...rowSelection.getCheckboxProps?.(record)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column, colIdx) => (
                    <TableCell key={`${column.key || colIdx}-${record[rowKey] ?? record.id ?? record.key ?? index}`}>
                      {column.render
                        ? column.render(record[column.key], record)
                        : record[column.key]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.action(record)}
                              className={
                                action.variant === "destructive"
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && renderPagination()}
    </div>
  );
}
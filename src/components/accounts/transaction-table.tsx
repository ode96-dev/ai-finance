"use client";

import { Transaction } from "@/app/generated/prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/categories";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Badge } from "../ui/badge";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/accounts";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

type TransactionId = Transaction["id"];

type SortField = "date" | "amount" | "category";
type SortDirection = "asc" | "desc";
type RecurringFilterValue = "recurring" | "non-recurring" | "";
type TransactionType = "INCOME" | "EXPENSE" | "";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

type DecimalLike = { toNumber: () => number } | number;

const RECURRING_INTERVALS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const toNumber = (value: DecimalLike): number =>
  typeof value === "object" && "toNumber" in value
    ? value.toNumber()
    : Number(value);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

const buildPageRange = (current: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
};

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

const SortableHeader = ({
  field,
  label,
  sortConfig,
  onSort,
}: SortableHeaderProps) => (
  <TableHead
    className="cursor-pointer select-none whitespace-nowrap"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <span className="text-muted-foreground/60">
        {sortConfig.field === field ? (
          sortConfig.direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronDown className="h-3.5 w-3.5 opacity-30" />
        )}
      </span>
    </div>
  </TableHead>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: PageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const pageRange = buildPageRange(currentPage, totalPages);
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {rangeStart}–{rangeEnd} of {totalItems}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v) as PageSize)}
          >
            <SelectTrigger className="h-7 w-15 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <ChevronFirst className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {pageRange.map((page, idx) =>
          page === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-7 w-7 items-center justify-center text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="icon"
              className="h-7 w-7 text-xs"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          <ChevronLast className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

interface TransactionCardProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: TransactionId, checked: boolean) => void;
  onEdit: (id: TransactionId) => void;
  onDelete: (id: TransactionId) => void;
}

const TransactionCard = ({
  transaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: TransactionCardProps) => {
  const amount = toNumber(transaction.amount as DecimalLike);
  const isExpense = transaction.type === "EXPENSE";

  return (
    <div
      className={`
        group relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200
        ${isSelected ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-card hover:border-border/80 hover:shadow-sm"}
      `}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) =>
          onSelect(transaction.id, checked === true)
        }
        className="mt-0.5 shrink-0"
      />

      <div
        className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full ${
          isExpense
            ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        }`}
      >
        {isExpense ? (
          <ArrowDownRight className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight">
            {transaction.description ?? "—"}
          </p>
          <span
            className={`shrink-0 text-sm font-semibold tabular-nums ${
              isExpense
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isExpense ? "−" : "+"}
            {formatCurrency(Math.abs(amount))}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {format(new Date(String(transaction.date)), "PP")}
          </span>
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white"
            style={{ background: categoryColors[transaction.category] }}
          >
            {transaction.category}
          </span>
          {transaction.isRecurring ? (
            <Badge
              variant="outline"
              className="gap-1 border-violet-200 bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400"
            >
              <RefreshCcw className="h-2.5 w-2.5" />
              {transaction.recurringInterval
                ? (RECURRING_INTERVALS[transaction.recurringInterval] ??
                  "Recurring")
                : "Recurring"}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 px-1.5 py-0.5 text-xs">
              <Clock className="h-2.5 w-2.5" />
              One-time
            </Badge>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onEdit(transaction.id)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(transaction.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable = ({ transactions }: TransactionTableProps) => {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<TransactionId[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<TransactionType>("");
  const [recurringFilter, setRecurringFilter] =
    useState<RecurringFilterValue>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  const filteredAndSortedTransactions = useMemo<Transaction[]>(() => {
    let result: Transaction[] = [...transactions];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((t) =>
        t.description?.toLowerCase().includes(lower),
      );
    }

    if (recurringFilter === "recurring") {
      result = result.filter((t) => t.isRecurring);
    } else if (recurringFilter === "non-recurring") {
      result = result.filter((t) => !t.isRecurring);
    }

    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;

      if (sortConfig.field === "date") {
        comparison =
          new Date(String(a.date)).getTime() -
          new Date(String(b.date)).getTime();
      } else if (sortConfig.field === "amount") {
        comparison =
          toNumber(a.amount as DecimalLike) - toNumber(b.amount as DecimalLike);
      } else if (sortConfig.field === "category") {
        comparison = a.category.localeCompare(b.category);
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  const totalItems = filteredAndSortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo<Transaction[]>(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAndSortedTransactions.slice(start, start + pageSize);
  }, [filteredAndSortedTransactions, safePage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, recurringFilter, sortConfig, pageSize]);

  const handleSort = useCallback((field: SortField): void => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleSelect = useCallback(
    (id: TransactionId, checked: boolean): void => {
      setSelectedIds((prev) =>
        checked
          ? prev.includes(id)
            ? prev
            : [...prev, id]
          : prev.filter((x) => x !== id),
      );
    },
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean): void => {
      const pageIds = paginatedTransactions.map((t) => t.id);
      setSelectedIds((prev) => {
        if (checked) {
          const merged = new Set([...prev, ...pageIds]);
          return Array.from(merged);
        }
        return prev.filter((id) => !pageIds.includes(id));
      });
    },
    [paginatedTransactions],
  );

  const handleBulkDelete = useCallback(async (): Promise<void> => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transaction${
          selectedIds.length !== 1 ? "s" : ""
        }?`,
      )
    )
      return;
    await deleteFn(selectedIds);
  }, [selectedIds, deleteFn]);

  const handleSingleDelete = useCallback(
    async (id: TransactionId): Promise<void> => {
      await deleteFn([id]);
    },
    [deleteFn],
  );

  const handleEdit = useCallback(
    (id: TransactionId): void => {
      router.push(`/transaction/create?edit=${id}`);
    },
    [router],
  );

  const handleClearFilters = useCallback((): void => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
  }, []);

  const handlePageChange = useCallback((page: number): void => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: PageSize): void => {
    setPageSize(size);
  }, []);

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.success("Transactions deleted successfully");
      setSelectedIds([]);
      router.refresh();
    }
  }, [deleted, deleteLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = Boolean(searchTerm || typeFilter || recurringFilter);

  const pageIds = paginatedTransactions.map((t) => t.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected =
    pageIds.some((id) => selectedIds.includes(id)) && !allPageSelected;

  return (
    <div className="space-y-4">
      {deleteLoading && (
        <BarLoader width="100%" color="#7c3aed" className="rounded-full" />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search transactions…"
            className="pl-9 h-9 bg-background"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TransactionType)}
          >
            <SelectTrigger className="h-9 w-32.5 bg-background text-sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(v) => setRecurringFilter(v as RecurringFilterValue)}
          >
            <SelectTrigger className="h-9 w-40 bg-background text-sm">
              <SelectValue placeholder="All transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring only</SelectItem>
              <SelectItem value="non-recurring">Non-recurring only</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 gap-1.5"
              onClick={handleBulkDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{totalItems}</span> of{" "}
          <span className="font-medium text-foreground">
            {transactions.length}
          </span>{" "}
          transactions
        </p>
      )}

      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b bg-muted/40">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allPageSelected}
                  data-indeterminate={somePageSelected}
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked === true)
                  }
                  aria-label="Select all on this page"
                  className={somePageSelected ? "opacity-70" : ""}
                />
              </TableHead>
              <SortableHeader
                field="date"
                label="Date"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHead>Description</TableHead>
              <SortableHeader
                field="category"
                label="Category"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader
                field="amount"
                label="Amount"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHead>Recurring</TableHead>
              <TableHead className="w-10 pr-4" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No transactions match your filters."
                    : "No transactions found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction: Transaction) => {
                const amount = toNumber(transaction.amount as DecimalLike);
                const isExpense = transaction.type === "EXPENSE";
                const isSelected = selectedIds.includes(transaction.id);

                return (
                  <TableRow
                    key={transaction.id}
                    className={`transition-colors ${
                      isSelected ? "bg-primary/5 hover:bg-primary/10" : ""
                    }`}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelect(transaction.id, checked === true)
                        }
                        aria-label={`Select transaction: ${transaction.description}`}
                      />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(String(transaction.date)), "PP")}
                    </TableCell>

                    <TableCell className="max-w-50">
                      <span className="block truncate text-sm font-medium">
                        {transaction.description ?? "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white capitalize"
                        style={{
                          background: categoryColors[transaction.category],
                        }}
                      >
                        {transaction.category}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
                          isExpense
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                        {formatCurrency(Math.abs(amount))}
                      </span>
                    </TableCell>

                    <TableCell>
                      {transaction.isRecurring ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="cursor-default gap-1 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400"
                              >
                                <RefreshCcw className="h-3 w-3" />
                                {transaction.recurringInterval
                                  ? (RECURRING_INTERVALS[
                                      transaction.recurringInterval
                                    ] ?? "Recurring")
                                  : "Recurring"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">Next date</p>
                              <p className="text-muted-foreground">
                                {transaction.nextRecurringDate
                                  ? format(
                                      new Date(
                                        String(transaction.nextRecurringDate),
                                      ),
                                      "PP",
                                    )
                                  : "—"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 text-muted-foreground"
                        >
                          <Clock className="h-3 w-3" />
                          One-time
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => handleEdit(transaction.id)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleSingleDelete(transaction.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
            {hasActiveFilters
              ? "No transactions match your filters."
              : "No transactions found."}
          </div>
        ) : (
          paginatedTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedIds.includes(transaction.id)}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleSingleDelete}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
};

export default TransactionTable;

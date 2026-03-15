import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Package, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import {
  getBranchProducts,
  toggleProductActiveInBranch,
} from "@/api/productApi.js";
import { useShop } from "@/hooks/useShop.js";
import BranchPricesTab from "../products/BranchPricesTab.jsx";

/**
 * Full branch product management panel.
 * Shows a table of BranchProducts with price, quantity, discount, toggle.
 * Click a row (or "Cập nhật") to open BranchPricesTab for editing.
 *
 * @param {string}   shopId         - ID cửa hàng
 * @param {string}   branchId       - ID chi nhánh
 * @param {Function} onCountChange  - Callback when total count changes
 */
export default function BranchProductPanel({
  shopId,
  branchId,
  onCountChange,
}) {
  const { selectedShop } = useShop();
  const trackInventory = selectedShop?.trackInventory ?? false;

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const debounceRef = useRef(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
  };

  const fetchProducts = useCallback(async () => {
    if (!shopId || !branchId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
      };
      if (sorting.length > 0) {
        params.sortBy = sorting[0].id;
        params.sortDir = sorting[0].desc ? "DESC" : "ASC";
      }
      if (debouncedKeyword) params.keyword = debouncedKeyword;

      const res = await getBranchProducts(shopId, branchId, params);
      const data = res.data?.data;
      let list = [];
      let total = 0;
      if (data && typeof data === "object" && "content" in data) {
        list = data.content ?? [];
        total = data.page?.totalElements ?? data.totalElements ?? 0;
      } else {
        list = Array.isArray(data) ? data : [];
        total = list.length;
      }
      setProducts(list);
      setTotalCount(total);
      onCountChange?.(total);
    } catch (err) {
      console.error("BranchProductPanel fetch error:", err);
      toast.error("Không thể tải danh sách sản phẩm chi nhánh.");
    } finally {
      setLoading(false);
    }
  }, [shopId, branchId, pagination, sorting, debouncedKeyword, onCountChange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Re-fetch when branchId changes
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [branchId]);

  const handleToggleActive = async (product) => {
    try {
      const res = await toggleProductActiveInBranch(
        shopId,
        branchId,
        product.id,
      );
      if (res.data?.success) {
        const updated = res.data.data;
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p)),
        );
        toast.success(
          updated?.activeInBranch
            ? "Đã bật sản phẩm tại chi nhánh."
            : "Đã tắt sản phẩm tại chi nhánh.",
        );
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: "images",
      header: "",
      enableSorting: false,
      enableHiding: false,
      size: 48,
      cell: ({ row }) => {
        const images = row.getValue("images");
        const firstImg = Array.isArray(images) ? images[0] : null;
        return (
          <div className="w-9 h-9 rounded-md border overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
            {firstImg ? (
              <img
                src={firstImg}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-4 h-4 text-gray-400" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tên sản phẩm" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground font-mono">
          {row.getValue("sku") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giá bán" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const price = product.price ?? product.defaultPrice;
        const discountPct = product.discountPercentage;
        const discountFlat = product.discountPrice;
        const hasDiscount =
          (discountPct != null && discountPct > 0) ||
          (discountFlat != null && discountFlat > 0);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {price ? Number(price).toLocaleString("vi-VN") + " ₫" : "-"}
            </span>
            {hasDiscount && (
              <span className="text-xs text-green-600">
                {discountFlat != null && discountFlat > 0
                  ? `KM: ${Number(discountFlat).toLocaleString("vi-VN")} ₫`
                  : `KM: -${discountPct}%`}
              </span>
            )}
          </div>
        );
      },
    },
    ...(trackInventory
      ? [
          {
            accessorKey: "quantity",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Tồn kho" />
            ),
            cell: ({ row }) => {
              const qty = row.getValue("quantity");
              const min = row.original.minQuantity;
              const low = min != null && qty != null && qty <= min;
              return (
                <div
                  className={`font-medium tabular-nums ${low ? "text-red-500" : ""}`}
                >
                  {qty ?? "-"}
                  {low && <span className="ml-1 text-xs">(thấp)</span>}
                </div>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: "activeInBranch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Đang bán" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={!!(product.activeInBranch ?? product.active)}
              onCheckedChange={() => handleToggleActive(product)}
            />
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(product);
                }}
              >
                Cập nhật giá / tồn kho
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, pagination, columnVisibility, rowSelection },
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            className="max-w-xs"
          />
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-md border">
        {loading && products.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenEdit(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có sản phẩm nào tại chi nhánh này.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {/* Edit BranchProduct Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Cập nhật sản phẩm tại chi nhánh</DialogTitle>
            <DialogDescription>
              {editingProduct?.name} — Điều chỉnh giá, tồn kho và trạng thái tại
              chi nhánh này.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <BranchPricesTab
              shopId={shopId}
              product={editingProduct}
              focusBranchId={branchId}
              onSuccess={() => {
                fetchProducts();
                setEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

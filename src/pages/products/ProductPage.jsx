import React, { useState, useEffect, useCallback } from "react";
import { useShop } from "../../hooks/useShop.js";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  PackagePlus,
  Package,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import {
  getProducts,
  deleteProduct,
  toggleProductActive,
} from "../../api/productApi.js";
import ProductFormModal from "./ProductFormModal.jsx";

const ProductPage = () => {
  const { selectedShopId, branches } = useShop();
  const shopId = selectedShopId;
  const { confirm } = useAlertDialog();

  // Chọn chi nhánh để xem sản phẩm
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Không auto-select chi nhánh - null = tất cả sản phẩm của shop

  const fetchProducts = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const params = selectedBranchId ? { branchIds: [selectedBranchId] } : {};
      const res = await getProducts(shopId, params);
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data?.content ?? data ?? []);
      setProducts(list);
    } catch (err) {
      console.error("Fetch products error:", err);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [shopId, selectedBranchId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Toggle active tại chi nhánh (activeInBranch)
  const handleToggleActive = async (product) => {
    try {
      const res = await toggleProductActive(
        shopId,
        product.branchId ?? selectedBranchId,
        product.id,
      );
      if (res.data?.success) {
        const updated = res.data.data;
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p)),
        );
        toast.success(
          updated?.activeInBranch
            ? "Đã kích hoạt sản phẩm."
            : "Đã tắt sản phẩm.",
        );
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  const handleDelete = async (product) => {
    const ok = await confirm(
      `Bạn có chắc muốn xóa sản phẩm "${product.name}" không? Hành động này không thể hoàn tác.`,
      {
        title: "Xóa sản phẩm",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      },
    );
    if (!ok) return;

    try {
      setIsSubmitting(true);
      const res = await deleteProduct(
        shopId,
        product.branchId ?? selectedBranchId,
        product.id,
      );
      if (res.data?.success) {
        toast.success("Xóa sản phẩm thành công.");
        await fetchProducts();
      } else {
        toast.error(res.data?.message || "Xóa sản phẩm thất bại.");
      }
    } catch (err) {
      console.error("Delete product error:", err);
      toast.error("Đã xảy ra lỗi khi xóa sản phẩm.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const columns = [
    {
      accessorKey: "images",
      header: "",
      enableSorting: false,
      enableHiding: false,
      size: 56,
      cell: ({ row }) => {
        const images = row.getValue("images");
        const firstImg = Array.isArray(images) ? images[0] : null;
        return (
          <div className="w-10 h-10 rounded-md border overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
            {firstImg ? (
              <img
                src={firstImg}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-gray-400" />
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
        <div className="text-sm text-muted-foreground font-mono">
          {row.getValue("sku") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      cell: ({ row }) => <div>{row.getValue("category") || "-"}</div>,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giá bán" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const price = row.getValue("price");
        const discountPrice = product.discountPrice;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {price ? Number(price).toLocaleString("vi-VN") + " ₫" : "-"}
            </span>
            {discountPrice != null && discountPrice > 0 && (
              <span className="text-xs text-green-600 line-through">
                {Number(discountPrice).toLocaleString("vi-VN")} ₫
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tồn kho" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const qty = row.getValue("quantity");
        const isLow = product.minQuantity > 0 && qty <= product.minQuantity;
        return (
          <div className="flex items-center gap-1">
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            <span className={isLow ? "text-amber-600 font-medium" : ""}>
              {qty}
            </span>
            <span className="text-xs text-muted-foreground">
              {product.unit}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "activeInBranch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Hoạt động" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Switch
            checked={!!product.activeInBranch}
            onCheckedChange={() => handleToggleActive(product)}
          />
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
                <MoreHorizontal />
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
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-100 focus:text-red-700"
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product);
                }}
              >
                Xóa
                <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
                  ⌘⌫
                </DropdownMenuShortcut>
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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedBranch = branches?.find((b) => b.id === selectedBranchId);

  return (
    <div className="h-full flex-1 flex-col gap-8 p-8 md:flex">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Quản lý sản phẩm
          </h2>

          {/* Branch filter dropdown */}
          {branches?.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 w-fit">
                  {selectedBranch?.name ?? "Tất cả chi nhánh"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuItem
                  onClick={() => setSelectedBranchId(null)}
                  className={!selectedBranchId ? "font-semibold" : ""}
                >
                  Tất cả chi nhánh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {branches.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={b.id === selectedBranchId ? "font-semibold" : ""}
                  >
                    {b.name}
                    {b.default && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Mặc định
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={table.getColumn("name")?.getFilterValue() ?? ""}
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
            <DataTableViewOptions table={table} />
          </div>
          <Button
            variant="success"
            size="sm"
            className="cursor-pointer"
            onClick={handleOpenCreate}
          >
            <PackagePlus className="mr-1 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border">
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
              {loading ? (
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
                    data-state={row.getIsSelected() && "selected"}
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
                    {selectedBranchId
                      ? "Chưa có sản phẩm nào tại chi nhánh này."
                      : "Chưa có sản phẩm nào trong cửa hàng."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        shopId={shopId}
        branchId={editingProduct?.branchId ?? selectedBranchId}
        branches={branches ?? []}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default ProductPage;

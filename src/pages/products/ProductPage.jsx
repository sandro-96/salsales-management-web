import React, { useState, useEffect, useCallback, useRef } from "react";
import { useShop } from "../../hooks/useShop.js";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, PackagePlus, Package } from "lucide-react";
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
  const { selectedShopId } = useShop();
  const shopId = selectedShopId;
  const { confirm } = useAlertDialog();

  // Chọn chi nhánh để xem sản phẩm

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const debounceRef = useRef(null);

  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
  };

  const fetchProducts = useCallback(async () => {
    if (!shopId) return;
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
      const res = await getProducts(shopId, params);
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setProducts(data.content ?? []);
        setTotalCount(data.page?.totalElements ?? data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, sorting, debouncedKeyword]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Toggle active tại chi nhánh (active)
  const handleToggleActive = async (product) => {
    try {
      const res = await toggleProductActive(shopId, product.productId);
      if (res.data?.success) {
        const updated = res.data.data;
        setProducts((prev) =>
          prev.map((p) =>
            p.productId === product.productId ? { ...p, ...updated } : p,
          ),
        );
        toast.success(
          updated?.active ? "Đã kích hoạt sản phẩm." : "Đã tắt sản phẩm.",
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
      const res = await deleteProduct(shopId, product.productId);
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
      accessorKey: "defaultPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giá bán" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const price = row.getValue("defaultPrice");
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
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Hoạt động" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={!!product.active}
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
    state: {
      sorting,
      pagination,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="h-full flex-1 flex-col gap-8 p-8 md:flex">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Quản lý sản phẩm
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
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
                    Chưa có sản phẩm nào trong cửa hàng.
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
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default ProductPage;

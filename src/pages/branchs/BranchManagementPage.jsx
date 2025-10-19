import React, { useState, useEffect } from "react";
import { useShop } from "../../hooks/useShop.js";
import axiosInstance from "../../api/axiosInstance.js";
import { useNavigate } from "react-router-dom";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronsUpDown,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import { Switch } from "@/components/ui/switch";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";

const BranchManagementPage = () => {
  const { selectedShopId } = useShop();
  const shopId = selectedShopId; // Lấy ID cửa hàng đã chọn từ context
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState(null); // State để lưu chi nhánh đang chỉnh sửa hoặc tạo
  const [isModalOpen, setIsModalOpen] = useState(false); // State để quản lý modal
  const [isCreateMode, setIsCreateMode] = useState(false); // State để xác định modal dùng để tạo hay sửa

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Lấy danh sách chi nhánh
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axiosInstance.get(`/branches`, {
          params: { shopId },
        });
        setBranches(response.data.data.content || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    if (shopId) fetchBranches();
  }, [shopId]);

  // Tạo chi nhánh mới
  const handleCreateBranch = async (request) => {
    try {
      const response = await axiosInstance.post(`/branches`, request, {
        params: { shopId },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBranches([...branches, response.data.data]);
      setIsModalOpen(false); // Đóng modal sau khi tạo
    } catch (err) {
      console.log(err);
    }
  };

  // Cập nhật chi nhánh
  const handleUpdateBranch = async (id, request) => {
    try {
      const response = await axiosInstance.put(`/branches/${id}`, request, {
        params: { shopId },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBranches(branches.map((b) => (b.id === id ? response.data.data : b)));
      setIsModalOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  // Xóa chi nhánh
  const handleDeleteBranch = async (id) => {
    try {
      await axiosInstance.delete(`/branches/${id}`, {
        params: { shopId },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBranches(branches.filter((b) => b.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Name" />;
      },
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("address")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone");
        return <div className="lowercase">{phone}</div>;
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Active" />;
      },
      cell: ({ row }) => {
        const active = row.getValue("active");
        const isDefault = row.getValue("isDefault");
        return (
          <div>
            <Switch
              id="airplane-mode"
              defaultChecked={active}
              disabled={isDefault}
            />
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:bg-red-100 focus:text-red-700">
                Delete
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
    data: branches,
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Quản lý Chi nhánh
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Filter names..."
              value={table.getColumn("name")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
            <Button
              variant="success"
              size="sm"
              className="cursor-pointer"
              onClick={() =>
                navigate("/branches/new", {
                  state: { background: { pathname: location.pathname } },
                })
              }
            >
              Add Branch
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
      <h2 className="text-2xl font-semibold mb-4">Quản lý Chi nhánh</h2>
      <div className="mb-4">
        <button
          onClick={() => {
            setSelectedBranch({ name: "", address: "", phone: "" }); // Khởi tạo giá trị mặc định
            setIsCreateMode(true);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm Chi nhánh mới
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Tên Chi nhánh</th>
              <th className="p-2 text-left">Địa chỉ</th>
              <th className="p-2 text-left">Số điện thoại</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b">
                <td className="p-2">{branch.name}</td>
                <td className="p-2">{branch.address}</td>
                <td className="p-2">{branch.phone || "Chưa có"}</td>
                <td className="p-2">
                  <button
                    onClick={() => {
                      setSelectedBranch(branch);
                      setIsCreateMode(false);
                      setIsModalOpen(true);
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mr-2"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() =>
                      branches.length > 1 && handleDeleteBranch(branch.id)
                    }
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={branches.length <= 1}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchManagementPage;

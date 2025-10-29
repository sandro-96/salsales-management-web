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
import { MoreHorizontal } from "lucide-react";
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
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import { Switch } from "@/components/ui/switch";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";

const BranchManagementPage = () => {
  const { selectedShopId } = useShop();
  const shopId = selectedShopId;
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        setBranches(response.data.data || []);
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
        const branch = row.original;
        const active = row.getValue("active");
        const isDefault = branch.default;
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
              {branch.default ? null : (
                <DropdownMenuItem className="text-red-600 focus:bg-red-100 focus:text-red-700">
                  Delete
                  <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
                    ⌘⌫
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              )}
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
    <div className="h-full flex-1 flex-col gap-8 p-8 md:flex">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Quản lý Chi nhánh
        </h2>
        <div className="flex items-center justify-end">
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
        <div className="flex items-center justify-between space-x-2">
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
          <DataTableViewOptions table={table} />
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
    </div>
  );
};

export default BranchManagementPage;

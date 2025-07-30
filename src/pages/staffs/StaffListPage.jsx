import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import StaffList from "../../components/shop/staff/StaffList";

const StaffListPage = () => {
    const { selectedShop } = useShop();
    const [staffs, setStaffs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [branchId, setBranchId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchStaffs = useCallback(async () => {
        if (!selectedShop) {
            console.log("Không có selectedShop, bỏ qua fetchStaffs");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const params = new URLSearchParams({ page, size: 10 });
            if (branchId) params.append("branchId", branchId);

            console.log(`Gửi request: /shops/${selectedShop.id}/users?${params.toString()}`);
            const response = await axiosInstance.get(`/shops/${selectedShop.id}/users?${params.toString()}`);
            setStaffs(response.data.data.content);
            setTotalPages(response.data.data.totalPages);
        } catch (err) {
            console.error("Lỗi khi tải danh sách nhân viên:", err);
            setError(
                err.response?.status === 403
                    ? "Bạn không có quyền truy cập danh sách nhân viên."
                    : err.response?.status === 404
                        ? "Cửa hàng hoặc chi nhánh không tồn tại."
                        : "Không thể tải danh sách nhân viên."
            );
        } finally {
            setIsLoading(false);
        }
    }, [selectedShop, page, branchId]);

    useEffect(() => {
        if (!selectedShop) {
            navigate("/shops");
            return;
        }

        fetchStaffs();
    }, [selectedShop, page, branchId, fetchStaffs, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-lg shadow w-full max-w-2xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Danh sách nhân viên của {selectedShop?.name || "Cửa hàng"}
                </h2>
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex-1 mr-4">
                        <label htmlFor="branchId" className="block text-sm font-medium text-gray-700">
                            Lọc theo chi nhánh
                        </label>
                        <input
                            type="text"
                            id="branchId"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            placeholder="Nhập ID chi nhánh (tùy chọn)"
                        />
                    </div>
                    <button
                        onClick={() => navigate("/staff/create")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Thêm nhân viên
                    </button>
                </div>
                {isLoading ? (
                    <p className="text-center text-gray-600">Đang tải...</p>
                ) : error ? (
                    <p className="text-center text-red-600">{error}</p>
                ) : staffs.length === 0 ? (
                    <p className="text-center text-gray-600">
                        Không có nhân viên nào trong {branchId ? "chi nhánh này" : "cửa hàng"}.
                    </p>
                ) : (
                    <StaffList staffs={staffs} />
                )}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 0}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Trang trước
                        </button>
                        <span className="self-center text-gray-600">
                            Trang {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Trang sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffListPage;

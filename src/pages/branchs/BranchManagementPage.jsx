import React, { useState, useEffect } from 'react';
import { useShop } from "../../hooks/useShop.js";
import axiosInstance from "../../api/axiosInstance.js";

const BranchManagementPage = () => {
    const { selectedShopId } = useShop();
    const shopId = selectedShopId; // Lấy ID cửa hàng đã chọn từ context
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null); // State để lưu chi nhánh đang chỉnh sửa hoặc tạo
    const [isModalOpen, setIsModalOpen] = useState(false); // State để quản lý modal
    const [isCreateMode, setIsCreateMode] = useState(false); // State để xác định modal dùng để tạo hay sửa

    // Lấy danh sách chi nhánh
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await axiosInstance.get(`/branches`, {
                    params: { shopId }
                });
                setBranches(response.data.data.content || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải danh sách chi nhánh');
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
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setBranches([...branches, response.data.data]);
            setError(null);
            setIsModalOpen(false); // Đóng modal sau khi tạo
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tạo chi nhánh');
        }
    };

    // Cập nhật chi nhánh
    const handleUpdateBranch = async (id, request) => {
        try {
            const response = await axiosInstance.put(`/branches/${id}`, request, {
                params: { shopId },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setBranches(branches.map(b => b.id === id ? response.data.data : b));
            setError(null);
            setIsModalOpen(false); // Đóng modal sau khi cập nhật
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể cập nhật chi nhánh');
        }
    };

    // Xóa chi nhánh
    const handleDeleteBranch = async (id) => {
        try {
            await axiosInstance.delete(`/branches/${id}`, {
                params: { shopId },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setBranches(branches.filter(b => b.id !== id));
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể xóa chi nhánh');
        }
    };

    // Tự động ẩn lỗi sau 5 giây
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    if (loading) return <div>Đang tải...</div>;

    return (
        <div className="p-6">
            {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 border border-red-400 rounded flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">&times;</button>
                </div>
            )}
            <h2 className="text-2xl font-semibold mb-4">Quản lý Chi nhánh</h2>
            <div className="mb-4">
                <button
                    onClick={() => {
                        setSelectedBranch({ name: '', address: '', phone: '' }); // Khởi tạo giá trị mặc định
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
                    {branches.map(branch => (
                        <tr key={branch.id} className="border-b">
                            <td className="p-2">{branch.name}</td>
                            <td className="p-2">{branch.address}</td>
                            <td className="p-2">{branch.phone || 'Chưa có'}</td>
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
                                    onClick={() => branches.length > 1 && handleDeleteBranch(branch.id)}
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

            {isModalOpen && selectedBranch && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">
                            {isCreateMode ? 'Thêm Chi nhánh mới' : 'Cập nhật Chi nhánh'}
                        </h3>
                        <div className="mb-4">
                            <label className="block mb-2">Tên Chi nhánh</label>
                            <input
                                type="text"
                                value={selectedBranch.name}
                                onChange={(e) => setSelectedBranch({ ...selectedBranch, name: e.target.value })}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Địa chỉ</label>
                            <input
                                type="text"
                                value={selectedBranch.address}
                                onChange={(e) => setSelectedBranch({ ...selectedBranch, address: e.target.value })}
                                className="w-full p-2 border rounded disabled:bg-gray-200 disabled:text-gray-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Số điện thoại</label>
                            <input
                                type="text"
                                value={selectedBranch.phone || ''}
                                onChange={(e) => setSelectedBranch({ ...selectedBranch, phone: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    if (isCreateMode) {
                                        handleCreateBranch(selectedBranch);
                                    } else {
                                        handleUpdateBranch(selectedBranch.id, selectedBranch);
                                    }
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
                                disabled={!selectedBranch.name.trim()}
                            >
                                {isCreateMode ? 'Tạo' : 'Lưu'}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagementPage;
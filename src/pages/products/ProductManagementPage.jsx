import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../../hooks/useShop.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useAlert } from "../../hooks/useAlert.js";
import { ALERT_TYPES } from "../../constants/alertTypes.js";
import { handleFileChange } from "../../utils/fileUtils.js"; // Giả sử bạn có util này cho upload images
import axiosInstance from "../../api/axiosInstance";
import { FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff, FaStore } from "react-icons/fa";
import LoadingOverlay from "../../components/loading/LoadingOverlay.jsx";

const sidebarColor = "#34516dff";

const ProductManagementPage = () => {
  const { showAlert } = useAlert();
  const { enums } = useAuth();
  const { selectedShop } = useShop();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      nameTranslations: {},
      categoryId: "",
      sku: "",
      costPrice: 0,
      defaultPrice: 0,
      unit: "",
      description: "",
      images: [],
      barcode: "",
      supplierId: "",
      variants: [],
      priceHistory: [],
      active: true,
      // BranchProduct fields
      branchId: "",
      quantity: 0,
      minQuantity: 0,
      price: 0,
      branchCostPrice: 0,
      discountPrice: null,
      discountPercentage: null,
      expiryDate: null,
      branchVariants: [],
      activeInBranch: true,
    },
  });

  const categoryOptions = enums?.categories || []; // Adjust based on actual enums
  const unitOptions = enums?.units || ["kg", "cái", "lít"]; // Example
  const supplierOptions = enums?.suppliers || []; // Fetch if needed

  // Fetch branches and categories on mount
  useEffect(() => {
    if (selectedShop) {
      fetchBranches();
      fetchProducts(selectedBranchId);
    }
  }, [selectedShop, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await axiosInstance.get(`/branches?shopId=${selectedShop.id}`);
      const branchesData = res.data.data.content || [];
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setSelectedBranchId(branchesData[0].id);
      }
    } catch (err) {
      showAlert({ title: "Lỗi", description: "Không thể tải danh sách chi nhánh.", type: ALERT_TYPES.ERROR, variant: "toast" });
    }
  };

  const fetchProducts = async (branchId) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/shops/${selectedShop.id}/products`, {
        params: { branchId, page: 0, size: 20, sort: "createdAt,desc" },
      });
      setProducts(res.data.data.content || []);
    } catch (err) {
      showAlert({ title: "Lỗi", description: "Không thể tải danh sách sản phẩm.", type: ALERT_TYPES.ERROR, variant: "toast" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const requestData = { ...data };
      // Handle images upload if needed (array of files)
      if (previewImages.length > 0) {
        requestData.images = previewImages; // Assume URLs or handle upload separately
      }

      let res;
      if (editProductId) {
        res = await axiosInstance.put(`/shops/${selectedShop.id}/branches/${data.branchId}/products/${editProductId}`, requestData);
      } else {
        res = await axiosInstance.post(`/shops/${selectedShop.id}/products`, requestData, { params: { branchId: data.branchId } });
      }

      if (res.data.success) {
        showAlert({ title: "Thành công", description: `Sản phẩm đã được ${editProductId ? "cập nhật" : "tạo"} thành công.`, type: ALERT_TYPES.SUCCESS, variant: "toast" });
        fetchProducts(selectedBranchId);
        closeModal();
      }
    } catch (err) {
      showAlert({ title: "Lỗi", description: err.response?.data?.message || "Đã xảy ra lỗi.", type: ALERT_TYPES.ERROR, variant: "toast" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id, branchId) => {
    showAlert({
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa sản phẩm này?",
      type: ALERT_TYPES.WARNING,
      variant: "modal",
      actions: [
        { label: "Hủy", className: "bg-gray-200 text-gray-800" },
        {
          label: "Xóa",
          className: "bg-red-500 text-white hover:bg-red-600",
          onClick: async () => {
            try {
              await axiosInstance.delete(`/shops/${selectedShop.id}/branches/${branchId}/products/${id}`);
              showAlert({ title: "Thành công", description: "Sản phẩm đã được xóa.", type: ALERT_TYPES.SUCCESS, variant: "toast" });
              fetchProducts(selectedBranchId);
            } catch (err) {
              showAlert({ title: "Lỗi", description: "Không thể xóa sản phẩm.", type: ALERT_TYPES.ERROR, variant: "toast" });
            }
          },
        },
      ],
    });
  };

  const handleToggleActive = async (id, branchId, currentActive) => {
    try {
      const res = await axiosInstance.put(`/shops/${selectedShop.id}/branches/${branchId}/products/${id}/toggle-active`);
      showAlert({ title: "Thành công", description: `Sản phẩm đã được ${currentActive ? "ngưng bán" : "kích hoạt"}.`, type: ALERT_TYPES.SUCCESS, variant: "toast" });
      fetchProducts(selectedBranchId);
    } catch (err) {
      showAlert({ title: "Lỗi", description: "Không thể thay đổi trạng thái.", type: ALERT_TYPES.ERROR, variant: "toast" });
    }
  };

  const openModal = (product = null) => {
    if (product) {
      reset(product);
      setEditProductId(product.id);
      setPreviewImages(product.images || []);
    } else {
      reset();
      setEditProductId(null);
      setPreviewImages([]);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    reset();
  };

  // Table columns (using react-table or custom)
  const columns = useMemo(
    () => [
      { Header: "Tên sản phẩm", accessor: "name" },
      { Header: "SKU", accessor: "sku" },
      { Header: "Giá bán", accessor: "price" },
      { Header: "Tồn kho", accessor: "quantity" },
      { Header: "Trạng thái", accessor: "activeInBranch", Cell: ({ value }) => value ? "Active" : "Inactive" },
      {
        Header: "Hành động",
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <button onClick={() => openModal(row.original)}><FaEdit /></button>
            <button onClick={() => handleDelete(row.original.id, row.original.branchId)}><FaTrash /></button>
            <button onClick={() => handleToggleActive(row.original.id, row.original.branchId, row.original.activeInBranch)}>
              {row.original.activeInBranch ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {isLoading && <LoadingOverlay text="Đang tải dữ liệu..." />}
      <h1 className="text-2xl font-bold mb-4">Quản lý sản phẩm</h1>

      <div className="sticky bg-white z-10 flex gap-2 mb-4 border-b pb-2" style={{ top: "var(--mobile-header-height, 0px)", zIndex: 30 }}>
        <select
          value={selectedBranchId || ""}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Tất cả chi nhánh</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded bg-blue-500 text-white"
        >
          <FaPlus className="inline mr-1" /> Tạo sản phẩm mới
        </button>
      </div>

      {/* Table - Implement with react-table or custom table */}
      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => <th key={col.Header}>{col.Header}</th>)}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {columns.map((col) => (
                  <td key={col.Header}>
                    {col.Cell ? col.Cell({ row: { original: product } }) : product[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 rounded-lg max-w-lg w-full"
            >
              <h2 className="text-lg font-bold mb-4">{editProductId ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}</h2>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Form fields similar to ShopSettings, grouped into sections */}
                <div className="space-y-4">
                  <div>
                    <label>Tên sản phẩm</label>
                    <input {...register("name", { required: true })} className="border p-2 w-full" />
                    {errors.name && <p className="text-red-500">Required</p>}
                  </div>
                  {/* Add other fields: categoryId, sku, costPrice, etc. */}
                  {/* Branch fields: branchId (select from branches), quantity, etc. */}
                  <div>
                    <label>Chi nhánh</label>
                    <select {...register("branchId", { required: true })} className="border p-2 w-full">
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Images upload */}
                  <div>
                    <label>Hình ảnh</label>
                    <input type="file" multiple onChange={(e) => handleFileChange({ event: e, setPreview: setPreviewImages })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white">Hủy</button>
                  <button type="submit" className="px-4 py-2 text-white" style={{ backgroundColor: sidebarColor }}>Lưu</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductManagementPage;
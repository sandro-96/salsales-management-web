// File: src/pages/product/ProductManagementPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../../hooks/useShop.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useAlert } from "../../hooks/useAlert.js";
import { ALERT_TYPES } from "../../constants/alertTypes.js";
import { handleFileChange } from "../../utils/fileUtils.js";
import axiosInstance from "../../api/axiosInstance";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import LoadingOverlay from "../../components/loading/LoadingOverlay.jsx";
import { SHOP_CATEGORIES } from "../../constants/shopCategories.js";

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
  const [previewImages, setPreviewImages] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      nameTranslations: {},
      category: "",
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

  const unitOptions = enums?.units || ["kg", "cái", "lít"];

  const categoryOptions = useMemo(() => {
    if (!selectedShop?.industry) return [];
    return SHOP_CATEGORIES[selectedShop.industry] || SHOP_CATEGORIES.OTHER;
  }, [selectedShop]);

  useEffect(() => {
    if (selectedShop) {
      fetchBranches();
      fetchProducts();
    }
  }, [selectedShop]);

  const fetchBranches = async () => {
    try {
      const res = await axiosInstance.get(`/branches?shopId=${selectedShop.id}`);
      setBranches(res.data.data.content || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
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
      console.error("Error fetching products:", err);
      showAlert({ title: "Lỗi", description: "Không thể tải danh sách sản phẩm.", type: ALERT_TYPES.ERROR, variant: "toast" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const requestData = { ...data };
      if (previewImages.length > 0) {
        requestData.images = previewImages;
      }

      let res;
      if (editProductId) {
        res = await axiosInstance.put(
          `/shops/${selectedShop.id}/branches/${data.branchId}/products/${editProductId}`,
          requestData
        );
      } else {
        res = await axiosInstance.post(`/shops/${selectedShop.id}/products`, requestData, {
          params: { branchId: data.branchId },
        });
      }

      if (res.data.success) {
        showAlert({
          title: "Thành công",
          description: `Sản phẩm đã được ${editProductId ? "cập nhật" : "tạo"} thành công.`,
          type: ALERT_TYPES.SUCCESS,
          variant: "toast",
        });
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
            } catch {
              showAlert({ title: "Lỗi", description: "Không thể xóa sản phẩm.", type: ALERT_TYPES.ERROR, variant: "toast" });
            }
          },
        },
      ],
    });
  };

  const handleToggleActive = async (id, branchId, currentActive) => {
    try {
      await axiosInstance.put(`/shops/${selectedShop.id}/branches/${branchId}/products/${id}/toggle-active`);
      showAlert({ title: "Thành công", description: `Sản phẩm đã được ${currentActive ? "ngưng bán" : "kích hoạt"}.`, type: ALERT_TYPES.SUCCESS, variant: "toast" });
    } catch {
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

  const columns = useMemo(
    () => [
      { Header: "Tên sản phẩm", accessor: "name" },
      { Header: "SKU", accessor: "sku" },
      { Header: "Giá bán", accessor: "price" },
      { Header: "Tồn kho", accessor: "quantity" },
      { Header: "Trạng thái", accessor: "activeInBranch", Cell: ({ value }) => (value ? "Active" : "Inactive") },
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
    <div className="p-6">
      {isLoading && <LoadingOverlay text="Đang tải dữ liệu..." />}
      <h2 className="text-2xl font-semibold mb-4">Quản lý sản phẩm</h2>
      <div className="mb-4">
        <button onClick={() => openModal()} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Tạo sản phẩm mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>{columns.map((col) => <th key={col.Header}>{col.Header}</th>)}</tr>
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

      {/* Modal */}
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
                <div className="space-y-4">
                  <div>
                    <label>Tên sản phẩm</label>
                    <input {...register("name", { required: true })} className="border p-2 w-full" />
                    {errors.name && <p className="text-red-500">Required</p>}
                  </div>
                  <div>
                    <label>Danh mục</label>
                    <div className="flex gap-2">
                      <select {...register("category", { required: "Vui lòng chọn hạng mục" })} className="border p-2 w-full">
                        <option value="">Chọn hạng mục</option>
                        {categoryOptions.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>SKU</label>
                    <input {...register("sku", { required: true })} className="border p-2 w-full" />
                  </div>

                  <div>
                    <label>Đơn vị</label>
                    <select {...register("unit", { required: true })} className="border p-2 w-full">
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Chi nhánh</label>
                    <select {...register("branchId", { required: true })} className="border p-2 w-full">
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>

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

import ExcelJS from "exceljs";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from "@/constants/productConstants";

const HEADERS = [
  { name: "SKU", required: false, width: 16 },
  { name: "Tên sản phẩm", required: true, width: 32 },
  { name: "Danh mục", required: true, width: 22 },
  { name: "Đơn vị", required: true, width: 16 },
  { name: "Barcode", required: false, width: 20 },
  { name: "Giá nhập mặc định", required: false, width: 20 },
  { name: "Giá bán mặc định", required: false, width: 20 },
  { name: "Giá bán chi nhánh", required: false, width: 20 },
  { name: "Giá nhập chi nhánh", required: false, width: 20 },
  { name: "Số lượng", required: false, width: 14 },
  { name: "Số lượng tối thiểu", required: false, width: 20 },
  { name: "Giá khuyến mãi", required: false, width: 18 },
  { name: "% Giảm giá", required: false, width: 14 },
  { name: "Hạn sử dụng", required: false, width: 16 },
  { name: "Mô tả", required: false, width: 36 },
  { name: "Trạng thái SP", required: false, width: 16 },
  { name: "Trạng thái chi nhánh", required: false, width: 22 },
];

const DATA_ROWS = 500; // số dòng áp dụng dropdown
const LISTS_SHEET = "Lists";

/**
 * Tạo và tải xuống file Excel mẫu cho nhập sản phẩm.
 * - Dropdown tại cột Danh mục, Đơn vị, Trạng thái SP, Trạng thái chi nhánh
 * - Header bắt buộc highlight đỏ
 * - 1 dòng ví dụ
 */
export const generateProductTemplate = async () => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sales Management";
  wb.created = new Date();

  const categoryLabels = PRODUCT_CATEGORIES.map((c) => c.label);
  const unitLabels = PRODUCT_UNITS.map((u) => u.label);

  /* ── Sheet ẩn chứa danh sách dropdown ─────────────────────────────────── */
  const listsSheet = wb.addWorksheet(LISTS_SHEET, { state: "veryHidden" });
  listsSheet.getColumn(1).header = "Danh mục";
  listsSheet.getColumn(2).header = "Đơn vị";

  const maxListLen = Math.max(categoryLabels.length, unitLabels.length);
  for (let i = 0; i < maxListLen; i++) {
    listsSheet.getRow(i + 1).values = [
      categoryLabels[i] ?? null,
      unitLabels[i] ?? null,
    ];
  }

  /* ── Sheet chính ───────────────────────────────────────────────────────── */
  const ws = wb.addWorksheet("Sản phẩm", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Column widths
  HEADERS.forEach((h, i) => {
    ws.getColumn(i + 1).width = h.width;
  });

  // Header row
  const headerRow = ws.addRow(HEADERS.map((h) => h.name));
  headerRow.height = 30;
  headerRow.eachCell((cell, colNum) => {
    const isRequired = HEADERS[colNum - 1]?.required;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isRequired ? "FFCC0000" : "FF374151" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FF6B7280" } },
    };
  });

  // Dòng ghi chú nhỏ màu xám — để user biết cột đỏ là bắt buộc
  const noteRow = ws.addRow([
    "* Cột đỏ = bắt buộc",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  noteRow.height = 18;
  noteRow.getCell(1).font = {
    italic: true,
    color: { argb: "FF9CA3AF" },
    size: 9,
  };
  noteRow.getCell(1).alignment = { horizontal: "left" };

  // Dòng ví dụ
  const exRow = ws.addRow([
    "CF_001",
    "Cà phê đen",
    "Đồ uống",
    "Ly",
    "",
    8000,
    25000,
    25000,
    8000,
    100,
    10,
    "",
    "",
    "",
    "Cà phê nguyên chất",
    "TRUE",
    "TRUE",
  ]);
  exRow.height = 22;
  exRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF9FAFB" },
    };
    cell.font = { color: { argb: "FF6B7280" }, italic: true };
  });

  /* ── Data validation (rows 4 → 4+DATA_ROWS) ───────────────────────────── */
  // Bắt đầu từ row 4 (row 1 = header, row 2 = ghi chú, row 3 = ví dụ)
  const firstDataRow = 4;
  const lastDataRow = firstDataRow + DATA_ROWS - 1;

  // Danh mục (col C = 3)
  ws.dataValidations.add(`C${firstDataRow}:C${lastDataRow}`, {
    type: "list",
    allowBlank: true,
    showDropDown: false,
    formulae: [`${LISTS_SHEET}!$A$1:$A$${categoryLabels.length}`],
    showErrorMessage: true,
    errorStyle: "warning",
    errorTitle: "Giá trị không hợp lệ",
    error: "Vui lòng chọn từ danh sách hoặc nhập tên danh mục tùy chỉnh.",
  });

  // Đơn vị (col D = 4)
  ws.dataValidations.add(`D${firstDataRow}:D${lastDataRow}`, {
    type: "list",
    allowBlank: true,
    showDropDown: false,
    formulae: [`${LISTS_SHEET}!$B$1:$B$${unitLabels.length}`],
    showErrorMessage: true,
    errorStyle: "warning",
    errorTitle: "Đơn vị không hợp lệ",
    error: "Vui lòng chọn đơn vị từ danh sách.",
  });

  // Trạng thái SP (col P = 16)
  ws.dataValidations.add(`P${firstDataRow}:P${lastDataRow}`, {
    type: "list",
    allowBlank: true,
    formulae: ['"TRUE,FALSE"'],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Giá trị không hợp lệ",
    error: "Chỉ chấp nhận TRUE hoặc FALSE.",
  });

  // Trạng thái chi nhánh (col Q = 17)
  ws.dataValidations.add(`Q${firstDataRow}:Q${lastDataRow}`, {
    type: "list",
    allowBlank: true,
    formulae: ['"TRUE,FALSE"'],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Giá trị không hợp lệ",
    error: "Chỉ chấp nhận TRUE hoặc FALSE.",
  });

  /* ── Download ──────────────────────────────────────────────────────────── */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "product_template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

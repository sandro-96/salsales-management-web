import imageCompression from "browser-image-compression";

export const handleFileChange = async ({
  event,
  setError,
  setFile,
  setPreview,
  allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxFileSizeMB = 5,
  compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  },
}) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!allowedTypes.includes(selectedFile.type)) {
        setError(`Chỉ hỗ trợ định dạng: ${allowedTypes.join(", ")}.`);
        setFile(null);
        setPreview(null);
        return;
    }

    if (selectedFile.size > maxFileSizeMB * 1024 * 1024) {
        setError(`Ảnh vượt quá ${maxFileSizeMB}MB. Đang tiến hành nén ảnh...`);
        try {
            const compressedFile = await imageCompression(selectedFile, compressionOptions);
            setFile(compressedFile);
            setPreview(URL.createObjectURL(compressedFile));
            setError("");
        } catch (err) {
            console.error("Error compressing image:", err);
            setError("Nén ảnh thất bại. Vui lòng chọn ảnh nhỏ hơn.");
            setFile(null);
            setPreview(null);
        }
        return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError("");
};
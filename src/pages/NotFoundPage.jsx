// src/pages/NotFoundPage.jsx
const NotFoundPage = () => {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-6">Trang bạn yêu cầu không tồn tại.</p>
            <a
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
                Quay về trang chủ
            </a>
        </div>
    );
};

export default NotFoundPage;
import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">Trang không tìm thấy</h2>
                <p className="text-gray-500 mb-8">
                    Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Quay về trang chủ
                </Link>
            </div>
        </div>
    );
}
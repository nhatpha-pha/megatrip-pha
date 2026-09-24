"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const NotFound = () => {
    const pathname = usePathname();

    useEffect(() => {
        console.error(
            "404 Error: User attempted to access non-existent route:",
            pathname,
        );
    }, [pathname]);

    return (
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">Không tìm thấy trang</CardTitle>
                    <CardDescription className="text-base">
                        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/">
                        <Button className="w-full">
                            Về trang chủ
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotFound;
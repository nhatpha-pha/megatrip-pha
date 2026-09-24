"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    children: ReactNode;
    redirectTo?: string;
};

export default function Protected({ children, redirectTo = "/dang-nhap" }: Props) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("accessToken");
        if (!token) {
            // replace so user can't go back to protected page
            router.replace(redirectTo);
            return;
        }
        setReady(true);
    }, [router, redirectTo]);

    if (!ready) return null;
    return <>{children}</>;
}

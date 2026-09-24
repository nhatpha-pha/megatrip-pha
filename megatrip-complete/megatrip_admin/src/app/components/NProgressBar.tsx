"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false });

export default function NProgressBar() {
    const pathname = usePathname();

    useEffect(() => {
        NProgress.start();
        NProgress.done();
        // eslint-disable-next-line
    }, [pathname]);

    return null;
}
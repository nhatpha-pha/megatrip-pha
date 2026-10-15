/** @format */

import axios from "axios";
import queryString from "query-string";
import { toast } from "sonner";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  paramsSerializer: (params) => queryString.stringify(params),
  timeout: 15000,
});

axiosClient.interceptors.request.use((config: any) => {
  const accesstoken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  config.headers = {
    Authorization: accesstoken ? `Bearer ${accesstoken}` : "",
    Accept: "application/json",
    ...config.headers,
  };
  config.data = config.data ? config.data : {};
  return config;
});

// guard to avoid showing many toasts/redirects when multiple requests fail
let sessionExpiredHandled = false;

axiosClient.interceptors.response.use(
  (res) => {
    if (res.data && res.status >= 200 && res.status < 300) {
      return res.data.data ?? res.data; // some APIs wrap in { data }
    }
    return Promise.reject({
      message: res.data?.message || "Unknown error",
      status: res.status,
      data: res.data,
    });
  },
  (error) => {
    const { response } = error;
    const errObj = {
      message: response?.data?.message || error.message || "Unknown error",
      status: response?.status,
      data: response?.data,
    };

    // If token expired or unauthorized (401), clear token and redirect to login
    if (response?.status === 401) {
      if (!sessionExpiredHandled) {
        sessionExpiredHandled = true;
        if (typeof window !== "undefined") {
          try {
            // Vietnamese message per request
            if (toast && typeof toast === "function") {
              // sonner exposes toast as function and also has toast.error
              // prefer toast.error if available
              // Remove unused @ts-expect-error
              toast.error
                ? toast.error(
                    "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại."
                  )
                : toast(
                    "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại."
                  );
            }
          } catch (e) {
            // fallback to alert if toast fails
            try {
              // eslint-disable-next-line no-alert
              alert(
                "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại."
              );
            } catch (ee) {
              // ignore
            }
          }

          try {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          } catch (e) {
            // ignore
          }

          // Redirect to login page
          try {
            window.location.href = "/dang-nhap";
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("API Error:", errObj);
    }
    return Promise.reject(errObj);
  }
);

export default axiosClient;

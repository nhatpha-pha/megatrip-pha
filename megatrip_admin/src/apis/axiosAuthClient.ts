/** @format */

import axios from 'axios';
import queryString from 'query-string';

let tokenStore: string | null = null;

export function setAccessToken(token: string | null) {
    tokenStore = token;
    try {
        if (token) localStorage.setItem('accessToken', token);
        else localStorage.removeItem('accessToken');
    } catch (e) { }
}

const axiosAuth = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:8080',
    paramsSerializer: (params) => queryString.stringify(params),
    timeout: 15000,
});

axiosAuth.interceptors.request.use((config: any) => {
    const local = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const token = tokenStore || local;
    config.headers = {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
        ...config.headers,
    };
    config.data = config.data ? config.data : {};
    return config;
});

axiosAuth.interceptors.response.use(
    (res) => {
        if (res.data && res.status >= 200 && res.status < 300) {
            return res.data.data;
        }
        return Promise.reject({
            message: res.data?.message || 'Unknown error',
            status: res.status,
            data: res.data,
        });
    },
    async (error) => {
        const { response } = error;
        let sessionExpired = false;
        if (response && response.status === 401) {
            tokenStore = null;
            try { localStorage.removeItem('accessToken'); } catch (e) { }
            // Hết phiên: đưa về trang đăng nhập thay vì để các thao tác sau báo "thiếu token".
            // Không chuyển trang nếu đang ở chính trang đăng nhập (đăng nhập sai mật khẩu cũng trả 401).
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
                sessionExpired = true;
                setTimeout(() => { window.location.href = '/admin/login'; }, 1200);
            }
        }
        const errObj = {
            message: sessionExpired
                ? 'Phiên đăng nhập đã hết hạn, đang chuyển về trang đăng nhập...'
                : response?.data?.message || error.message || 'Unknown error',
            status: response?.status,
            data: response?.data,
        };
        // Dùng warn (không phải error) để Next.js dev overlay không bật bảng đỏ cho các lỗi trang đã tự xử lý.
        // Ghi rõ method + url + mã lỗi để biết yêu cầu nào đang lỗi.
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                `[API Auth] ${String(error?.config?.method || '').toUpperCase()} ${error?.config?.url} -> ${errObj.status ?? 'no response'}: ${errObj.message}`
            );
        }
        return Promise.reject(errObj);
    }
);

export default axiosAuth;

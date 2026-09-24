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
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
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
        if (response && response.status === 401) {
            tokenStore = null;
            try { localStorage.removeItem('accessToken'); } catch (e) { }
        }
        const errObj = {
            message: response?.data?.message || error.message || 'Unknown error',
            status: response?.status,
            data: response?.data,
        };
        if (process.env.NODE_ENV === 'development') console.error('API Auth Error:', errObj);
        return Promise.reject(errObj);
    }
);

export default axiosAuth;

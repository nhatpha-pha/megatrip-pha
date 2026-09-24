/** @format */

import axios from 'axios';
import queryString from 'query-string';

/**
 *
 * This module sets up a customized Axios client for making HTTP requests.
 * Features:
 * - Uses query-string for serializing query parameters.
 * - Automatically attaches JWT access token from localStorage to Authorization header.
 * - Handles response formatting and error extraction.
 *
 * Usage:
 *   import axiosClient from './apis/axiosClient';
 *   axiosClient.get('/endpoint');
 *
 * Guidelines:
 * 1. Store your JWT access token in localStorage under the key 'accessToken'.
 * 2. Use axiosClient for all API requests to ensure consistent headers and error handling.
 * 3. The response interceptor returns only the 'data' property from the API response.
 * 4. Errors are returned as rejected Promises with the error message.
 * 5. You can customize the baseURL by uncommenting and editing the baseURL property.
 */

const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001', // base url server, ưu tiên biến môi trường
    paramsSerializer: (params) => queryString.stringify(params),
    timeout: 15000, // 15 giây, tránh treo request
});

axiosClient.interceptors.request.use(async (config: any) => {
    const accesstoken = localStorage.getItem('accessToken');

    config.headers = {
        Authorization: accesstoken ? `Bearer ${accesstoken}` : '',
        Accept: 'application/json',
        ...config.headers,
    };
    config.data = config.data ? config.data : {};
    return config;
});

axiosClient.interceptors.response.use(
    (res) => {
        if (res.data && res.status >= 200 && res.status < 300) {
            return res.data.data;
        } else {
            return Promise.reject({
                message: res.data?.message || 'Unknown error',
                status: res.status,
                data: res.data
            });
        }
    },
    async (error) => {
        const { response, config } = error;
        // Xử lý lỗi hết hạn token (nếu backend trả về 401 và có refresh token)
        if (response && response.status === 401 && !config._retry) {
            // const refreshToken = localStorage.getItem('refreshToken');
            // if (refreshToken) {
            //     config._retry = true;
            //     // Gọi API refresh token ở đây, sau đó thử lại request cũ
            // }
        }
        // Chuẩn hóa lỗi trả về
        const errObj = {
            message: response?.data?.message || error.message || 'Unknown error',
            status: response?.status,
            data: response?.data
        };
        if (process.env.NODE_ENV === 'development') {
            // Ghi log lỗi khi dev
            // eslint-disable-next-line no-console
            console.error('API Error:', errObj);
        }
        return Promise.reject(errObj);
    }
);

export default axiosClient;
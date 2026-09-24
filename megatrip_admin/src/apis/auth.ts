import axiosClient from './axiosClient';
import axiosAuth, { setAccessToken } from './axiosAuthClient';
import { API_NAMES } from './apiNames';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; password: string; name?: string };
type VerifyOtpPayload = { email: string; code: string };
type ResendOtpPayload = { email: string };
type ForgotPayload = { email: string };
type ResetPayload = { email: string; token: string; password: string };

export async function login(payload: LoginPayload) {
    const res: any = await axiosAuth.post(API_NAMES.users.login, payload);
    // If login returns token, set it in axiosAuth token store
    const token = res?.token || res?.accessToken || res?.data?.token;
    if (token) setAccessToken(token);
    return res;
}

export async function register(payload: RegisterPayload) {
    return axiosAuth.post(API_NAMES.users.register, payload);
}

export async function verifyOtp(payload: VerifyOtpPayload) {
    return axiosAuth.post(API_NAMES.auth.verifyOtp, payload);
}

export async function resendOtp(payload: ResendOtpPayload) {
    return axiosAuth.post(API_NAMES.auth.resendOtp, payload);
}

export async function forgotPassword(payload: ForgotPayload) {
    return axiosAuth.post(API_NAMES.auth.forgotPassword, payload);
}

export async function resetPassword(payload: ResetPayload) {
    return axiosAuth.post(API_NAMES.auth.resetPassword, payload);
}

export async function me() {
    return axiosAuth.get(API_NAMES.users.me);
}

export async function listUsers(params?: { page?: number; limit?: number; q?: string }) {
    const query = [] as string[];
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (params?.q) query.push(`q=${encodeURIComponent(params.q)}`);
    const url = `${API_NAMES.users.list}${query.length ? `?${query.join('&')}` : ''}`;
    return axiosAuth.get(url);
}

export async function getUserById(id: string) {
    return axiosAuth.get(`${API_NAMES.users.getById}/${id}`);
}

export async function adminCreateUser(payload: { name?: string; email: string; password: string; role?: string; phone?: string; address?: string }) {
    return axiosAuth.post(API_NAMES.users.adminCreate, payload);
}

export async function adminUpdateUser(id: string, payload: Partial<{ name: string; email: string; password: string; role: string; phone: string; address: string }>) {
    return axiosAuth.put(`${API_NAMES.users.adminUpdate}/${id}`, payload);
}

export async function adminDeleteUser(id: string) {
    return axiosAuth.delete(`${API_NAMES.users.adminDelete}/${id}`);
}

export async function getUserOrderStats(ids: string[]) {
    return axiosAuth.post(API_NAMES.orders.statsByCustomers, { ids });
}

export async function logout() {
    try {
        localStorage.removeItem('accessToken');
    } catch (e) { }
    try {
        setAccessToken('');
    } catch (e) { }
}

export default { login, register, verifyOtp, resendOtp, forgotPassword, resetPassword, me, logout, listUsers, getUserById, adminCreateUser, adminUpdateUser, adminDeleteUser, getUserOrderStats };

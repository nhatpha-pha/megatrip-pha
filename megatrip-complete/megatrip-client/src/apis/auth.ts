import axios from 'axios';
import axiosClient from './axiosClient';
import { API_NAMES } from './apiNames';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; password: string };
type VerifyOtpPayload = { email: string; code: string };
type ResendOtpPayload = { email: string };
type UpdateProfilePayload = { name: string; address: string; phone: string; dob: string };

export async function login(payload: LoginPayload) {
    return axiosClient.post(API_NAMES.users.login, payload);
}

export async function register(payload: RegisterPayload) {
    return axiosClient.post(API_NAMES.users.register, payload);
}

export async function verifyOtp(payload: VerifyOtpPayload) {
    return axiosClient.post(API_NAMES.auth.verifyOtp, payload);
}

export async function resendOtp(payload: ResendOtpPayload) {
    return axiosClient.post(API_NAMES.auth.resendOtp, payload);
}

type ForgotPayload = { email: string };
type ResetPayload = { email: string; token: string; password: string };

export async function forgotPassword(payload: ForgotPayload) {
    return axiosClient.post(API_NAMES.auth.forgotPassword, payload);
}

export async function resetPassword(payload: ResetPayload) {
    return axiosClient.post(API_NAMES.auth.resetPassword, payload);
}

export async function updateProfile(payload: UpdateProfilePayload) {
    // Use direct URL since this API is on different port
    return axios.put('http://localhost:8080/api/auth/me', payload, {
        headers: {
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
            'Content-Type': 'application/json',
        },
    });
}

export async function me() {
    return axiosClient.get(API_NAMES.users.me);
}

export default { login, register, verifyOtp, resendOtp, updateProfile, me, forgotPassword, resetPassword };

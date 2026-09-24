/** @format */

export const API_NAMES = {
    users: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        profile: '/api/auth/profile',
        me: '/api/auth/me',
        list: '/api/auth/users',
        getById: '/api/auth/user',
        adminCreate: '/api/auth/admin/user',
        adminUpdate: '/api/auth/admin/user',
        adminDelete: '/api/auth/admin/user',
    },
    auth: {
        verifyOtp: '/api/auth/verify-otp',
        resendOtp: '/api/auth/resend-otp',
        forgotPassword: '/api/auth/forgot-password',
        resetPassword: '/api/auth/reset-password',
    },
    orders: {
        statsByCustomers: '/api/orders/stats/by-customers'
    }
};
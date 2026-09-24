import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// NProgress.configure({ showSpinner: false }); // Tắt spinner, chỉ dùng thanh loading

export const startLoading = () => NProgress.start();
export const stopLoading = () => NProgress.done();
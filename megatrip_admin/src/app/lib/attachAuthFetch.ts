// Tự động gắn "Authorization: Bearer <accessToken>" vào mọi fetch() gọi tới backend.
// Lý do: nhiều trang dùng fetch() thuần (không qua axios) nên không gửi token, trong khi
// backend yêu cầu đăng nhập cho các thao tác quản trị -> bị 401. Patch này sửa tất cả cùng lúc.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080').replace(/\/$/, '');

if (typeof window !== 'undefined' && !(window as any).__megatripFetchPatched) {
  (window as any).__megatripFetchPatched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith(API_BASE)) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const headers = new Headers(
            init?.headers || (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined)
          );
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
          return originalFetch(input, { ...init, headers });
        }
      }
    } catch (e) {
      /* lỗi patch không được làm hỏng request gốc */
    }
    return originalFetch(input, init);
  };
}

export {};

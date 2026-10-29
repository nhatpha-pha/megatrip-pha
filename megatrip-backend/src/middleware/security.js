// Lightweight in-memory protection. For multi-instance production, use a shared store (e.g. Redis).
const buckets = new Map();
function rateLimit({ windowMs = 60_000, max = 10, message = 'Quá nhiều yêu cầu, vui lòng thử lại sau.' } = {}) {
  return (req, res, next) => {
    const key = `${req.ip || req.socket?.remoteAddress || 'unknown'}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let item = buckets.get(key);
    if (!item || item.resetAt <= now) item = { count: 0, resetAt: now + windowMs };
    item.count += 1;
    buckets.set(key, item);
    if (item.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((item.resetAt - now) / 1000))));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}
function securityHeaders(_req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}
module.exports = { rateLimit, securityHeaders };

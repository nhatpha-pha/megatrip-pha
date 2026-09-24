const CACHE_PREFIX = 'mt_flight_offers_cache_v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

export function cleanExpiredFlightCaches() {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		const now = Date.now();
		const keys = Object.keys(localStorage);
		for (const k of keys) {
			if (!k.startsWith(`${CACHE_PREFIX}::`)) continue;
			const raw = localStorage.getItem(k);
			if (!raw) {
				try { localStorage.removeItem(k); } catch {}
				continue;
			}
			try {
				const parsed = JSON.parse(raw);
				if (!parsed || !parsed.timestamp) {
					try { localStorage.removeItem(k); } catch {}
					continue;
				}
				const age = now - parsed.timestamp;
				if (age > CACHE_TTL_MS) {
					try { localStorage.removeItem(k); } catch (e) { console.warn('Failed remove expired', k, e); }
				}
			} catch (e) {
				// corrupted entry -> remove it
				try { localStorage.removeItem(k); } catch {}
			}
		}
	} catch (e) {
		console.warn('cleanExpiredFlightCaches error', e);
	}
}

// Run once on import (useful if this module is imported in a global Layout/_app)
try {
	if (typeof window !== 'undefined') {
		// immediate cleanup
		cleanExpiredFlightCaches();
		// expose helper globally
		(window as any).mt_cleanExpiredFlightCaches = cleanExpiredFlightCaches;
		// optional periodic cleanup while this page is open
		const INTERVAL_MS = 15 * 60 * 1000; // 15 phút
		const _intervalId = setInterval(cleanExpiredFlightCaches, INTERVAL_MS);
		// store interval id so consumer can clear if needed
		(window as any).__mt_cleanExpiredFlightCaches_interval = _intervalId;
	}
} catch (e) {
	/* ignore */
}

export default cleanExpiredFlightCaches;

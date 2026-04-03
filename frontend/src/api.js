// In production (Render), fall back to the known backend URL if env var isn't injected
const _apiBase = import.meta.env.VITE_API_URL
  || (typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "https://nepalwander-api.onrender.com"
      : "");
const BASE = _apiBase + "/api";

const getAccessToken = () => localStorage.getItem("nw-token");
const getRefreshToken = () => localStorage.getItem("nw-refresh");

const headers = (auth = false) => {
  const h = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
  }
  return h;
};

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) { clearToken(); return null; }
  const data = await res.json();
  if (data.access) { localStorage.setItem("nw-token", data.access); return data.access; }
  clearToken();
  return null;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Retry delays for Render free-tier cold starts (can take up to 50s)
const RETRY_DELAYS = [5000, 10000, 15000, 20000];

async function request(url, options = {}, auth = false, retry = true, attempt = 0) {
  try {
    const res = await fetchWithTimeout(`${BASE}${url}`, { ...options, headers: headers(auth) });
    if (res.status === 401 && auth && retry && getRefreshToken()) {
      const newAccess = await refreshAccessToken();
      if (newAccess) return request(url, options, auth, false);
    }
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    // Retry on network errors — covers Render free-tier cold start (up to ~62s total)
    if ((err instanceof TypeError || err.name === "AbortError") && attempt < RETRY_DELAYS.length) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
      return request(url, options, auth, retry, attempt + 1);
    }
    throw err;
  }
}

// Exported so App can warm up the backend on page load
export async function pingBackend() {
  if (!_apiBase) return;
  try { await fetchWithTimeout(`${_apiBase}/`, {}, 30000); } catch { /* silent */ }
}

const get  = (url, auth = false) => request(url, { method: "GET" }, auth);
const post = (url, data, auth = false) => request(url, { method: "POST", body: JSON.stringify(data) }, auth);
const patch = (url, data, auth = false) => request(url, { method: "PATCH", body: JSON.stringify(data) }, auth);
const del  = (url, data = null, auth = false) =>
  request(url, { method: "DELETE", ...(data ? { body: JSON.stringify(data) } : {}) }, auth);

export const api = {
  // Destinations
  destinations: (params = "") => get(`/destinations/${params}`),
  destination: (slug) => get(`/destinations/${slug}/`),

  // Hotels
  hotels: (params = "") => get(`/hotels/${params}`),
  hotel: (slug) => get(`/hotels/${slug}/`),

  // Guides
  guides: (params = "") => get(`/guides/${params}`),
  guide: (slug) => get(`/guides/${slug}/`),

  // Categories
  categories: () => get("/categories/"),

  // Auth
  login: (data) => post("/auth/login/", data),
  register: (data) => post("/auth/register/", data),
  profile: () => get("/auth/profile/", true),
  updateProfile: (data) => patch("/auth/profile/", data, true),

  // Reviews
  submitReview: (data) => post("/reviews/", data, true),
  deleteReview: (id) => del(`/reviews/${id}/`, null, true),
  myReviews: () => get("/my-reviews/", true),

  // Safety
  safetyAlerts: () => get("/safety-alerts/"),
  emergencyContacts: () => get("/emergency-contacts/"),

  // Favorites
  favorites: () => get("/favorites/", true),
  addFavorite: (data) => post("/favorites/", data, true),
  removeFavorite: (data) => del("/favorites/", data, true),
  checkFavorite: (content_type, id) => get(`/favorites/check/?content_type=${content_type}&id=${id}`, true),
  async toggleFavorite(data) {
    // POST acts as toggle: adds if not exists, removes if already saved
    const body = { content_type: data.content_type, item_name: data.item_name || "" };
    if (data.content_type !== "transport") {
      body[`${data.content_type}_id`] = data.id;
    }
    return await post("/favorites/", body, true);
  },

  // Visit History
  visitHistory: () => get("/visit-history/", true),
  addVisit: (data) => post("/visit-history/", data, true),

  // Payments
  payments: () => get("/payments/", true),
  createPayment: (data) => post("/payments/", data, true),

  // Refunds
  refunds: () => get("/refunds/", true),
  requestRefund: (data) => post("/refunds/", data, true),

  // Admin
  adminBookingLogs: () => get("/admin/booking-logs/", true),
  adminPayments: () => get("/admin/payments/", true),
  adminRefunds: () => get("/admin/refunds/", true),
  adminUpdateRefund: (id, data) => patch(`/admin/refunds/${id}/`, data, true),
  adminUserActivity: (userId) => get(userId ? `/admin/user-activity/?user_id=${userId}` : "/admin/user-activity/", true),
  adminConfirmBooking: (id, status) => patch(`/admin/bookings/${id}/confirm/`, { status }, true),
  adminReviews: () => get("/admin/reviews/", true),
  adminUpdateReview: (id, data) => patch(`/admin/reviews/${id}/`, data, true),
  adminDeleteReview: (id) => del(`/admin/reviews/${id}/`, null, true),
  adminFavourites: () => get("/admin/favourites/", true),
  adminDeleteFavourite: (id) => del(`/admin/favourites/${id}/`, null, true),

  // Notifications
  notifications: () => get("/notifications/", true),
  markAllNotificationsRead: () => patch("/notifications/", {}, true),
  markNotificationRead: (id) => patch(`/notifications/${id}/read/`, {}, true),

  // Search
  search: (q) => get(`/search/?q=${encodeURIComponent(q)}`),

  // Utility
  weather: () => get("/weather/"),
  estimateCost: (data) => post("/estimate-cost/", data),
  stats: () => get("/stats/", true),

  // Newsletter & Contact
  newsletter: (email) => post("/newsletter/", { email }),
  contact: (data) => post("/contact/", data),

  // Trip plans
  tripPlans: () => get("/trip-plans/", true),
  createTripPlan: (data) => post("/trip-plans/", data, true),
};

export function saveToken(access, refresh) {
  localStorage.setItem("nw-token", access);
  localStorage.setItem("nw-refresh", refresh);
}

export function clearToken() {
  localStorage.removeItem("nw-token");
  localStorage.removeItem("nw-refresh");
}

export function hasToken() {
  return !!getAccessToken();
}

// ── ElevenLabs AI chatbot ──
export async function getSignedUrl() {
  const res = await fetch(`${BASE}/elevenlabs/signed-url/`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get signed URL");
  return data.signedUrl;
}

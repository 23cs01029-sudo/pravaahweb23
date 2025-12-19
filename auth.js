/* ==========================================================
   PRAVAAH — AUTH + ROLE HANDLER (SHARED)
   - Firebase Auth init (safe)
   - Admin role check
   - Dashboard visibility
========================================================== */

import { initializeApp, getApps } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};

/* ---------- INIT (SAFE) ---------- */
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const auth = getAuth(app);

/* ---------- CONSTANTS ---------- */
const ROLE_CACHE_KEY = "pravaah_user_role";
const ROLE_CACHE_TS  = "pravaah_role_ts";
const ROLE_TTL_MS    = 60 * 1000; // 1 minute

const API_URL = "/api/pravaah";

/* ==========================================================
   🔐 AUTH + ROLE CHECK
========================================================== */

export function initAuth({
  requireAuth = true,
  redirectTo = "index.html",
  showDashboard = true
} = {}) {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      if (requireAuth) window.location.href = redirectTo;
      return;
    }

    if (!showDashboard) return;

    const dashboardNav = document.getElementById("dashboardNav");
    if (!dashboardNav) return;

    try {
      /* ---------- CACHE CHECK ---------- */
      const cachedRole = sessionStorage.getItem(ROLE_CACHE_KEY);
      const cachedTs   = sessionStorage.getItem(ROLE_CACHE_TS);

      if (
        cachedRole &&
        cachedTs &&
        Date.now() - Number(cachedTs) < ROLE_TTL_MS
      ) {
        if (isAdmin(cachedRole)) {
          dashboardNav.classList.remove("hidden");
        }
        return;
      }

      /* ---------- FETCH ROLE ---------- */
      const res = await fetch(
        `${API_URL}?type=role&email=${encodeURIComponent(user.email)}`
      );
      const roleObj = await res.json();

      const role =
        roleObj?.role ||
        roleObj?.Role ||
        roleObj?.data?.role ||
        "";

      /* ---------- CACHE ---------- */
      sessionStorage.setItem(ROLE_CACHE_KEY, role);
      sessionStorage.setItem(ROLE_CACHE_TS, Date.now().toString());

      /* ---------- APPLY ---------- */
      if (isAdmin(role)) {
        dashboardNav.classList.remove("hidden");
      }

    } catch (err) {
      console.warn("Auth role check failed", err);
    }
  });
}

/* ---------- HELPERS ---------- */
function isAdmin(role) {
  return ["Admin", "SuperAdmin", "SuperAccount"].includes(role);
}

/* ---------- EXPORT AUTH (OPTIONAL) ---------- */
export { auth };

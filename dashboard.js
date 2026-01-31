/* ============================================================
   PRAVAAH — ADMIN DASHBOARD LOGIC (FINAL + ROLE CORRECT)
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const FRONTEND_BASE = "https://iitbbspravaah.in";


/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d.firebaseapp.com",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ================= BACKEND ================= */
const API = "/api/pravaah";

/* ================= DOM ================= */
const adminEmailEl = document.getElementById("adminEmail");
const adminRoleEl = document.getElementById("adminRole");

const overallStatsSection = document.getElementById("overallStatsSection");
const cardTotalReg = document.getElementById("cardTotalReg");
const cardMoney = document.getElementById("cardMoney");
const passStatsSection = document.getElementById("passStatsSection");
const roleSection = document.getElementById("roleSection");

const statTotalReg = document.getElementById("statTotalReg");
const statMoney = document.getElementById("statMoney");
const statScan = document.getElementById("statScan");
const statInCampus = document.getElementById("statInCampus");
const statAccommodation = document.getElementById("statAccommodation");

const passDay = document.getElementById("passDay");
const passFest = document.getElementById("passFest");
const passStar = document.getElementById("passStar");
const passVisitor = document.getElementById("passVisitor");

const dayDropdown = document.getElementById("dayDropdown");
const eventDropdown = document.getElementById("eventDropdown");

const eventCountEl = document.getElementById("eventCount");
const openEventRegSheet = document.getElementById("openEventRegSheet");
const openEventEntrySheet = document.getElementById("openEventEntrySheet");
const openPassesSheet = document.getElementById("openPassesSheet");

const roleEmailInput = document.getElementById("roleEmail");
const roleSelect = document.getElementById("roleSelect");
const saveRoleBtn = document.getElementById("saveRoleBtn");
const primaryWarning = document.getElementById("primaryWarning");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

const offlineCountEl = document.getElementById("offlineCount");
const openGateLogsSheet = document.getElementById("openGateLogsSheet");
// ================= ACCOMMODATION DOM =================
const accDayDropdown = document.getElementById("accDayDropdown");

const accBoysSingle = document.getElementById("accBoysSingle");
const accBoysCommon = document.getElementById("accBoysCommon");
const accGirlsSingle = document.getElementById("accGirlsSingle");
const accGirlsCommon = document.getElementById("accGirlsCommon");

// Capacity control (SuperAccount)
const accControlSection = document.getElementById("accControlSection");
const accControlDay = document.getElementById("accControlDay");
const accGenderFilter = document.getElementById("accGenderFilter"); // boys/girls
const accRoomFilter = document.getElementById("accRoomFilter");     // single/common
const accCapacityInput = document.getElementById("accCapacityInput");

const saveAccCapacity = document.getElementById("saveAccCapacity");

let CURRENT_ACC_DAY = "";

/* ================= STATE ================= */
let CURRENT_ROLE = "USER";
let IS_PRIMARY = false;
let CURRENT_DAY = "";
let CURRENT_EVENT = "";
let REFRESH_TIMER = null;
async function loadDashboardStats() {
  // 1️⃣ Load cached data instantly (if exists)
  const cached = getCachedDashboard();
  if (cached) {
    applyStatsToUI(cached);
  }

  // 2️⃣ Fetch fresh data from backend
  try {
    const qs = new URLSearchParams({
      type: "dashboardStats",
      day: CURRENT_DAY || "",
      event: CURRENT_EVENT || "",
      role: CURRENT_ROLE || ""
    });

    const res = await fetch(`${API}?${qs.toString()}`);
    const data = await res.json();

    // Save to cache
    cacheDashboard(data);

    // Update UI
    applyStatsToUI(data);

  } catch (err) {
    console.error("Dashboard stats fetch failed, using cache", err);
  }
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

if (accDayDropdown && accDayDropdown.value) {
  CURRENT_ACC_DAY = accDayDropdown.value;
  loadAccommodationStats();
}

  // 1️⃣ Load cached role instantly (no lag)
const cachedRole = getCachedRole(user.email);
if(cachedRole){
  CURRENT_ROLE = cachedRole.role;
  IS_PRIMARY   = cachedRole.isPrimary;
  adminEmailEl.textContent = user.email;
  adminRoleEl.textContent =
    CURRENT_ROLE === "SuperAccount" && IS_PRIMARY
      ? "SuperAccount (Primary)"
      : CURRENT_ROLE;

  applyRoleVisibility(); // UI visible without waiting
}

// 2️⃣ Fetch fresh role from server
const roleRes = await fetch(`${API}?type=role&email=${encodeURIComponent(user.email)}`);
const roleObj = await roleRes.json();

CURRENT_ROLE = roleObj?.role || "USER";
IS_PRIMARY = roleObj?.isPrimary === true;

// Update cache for future instant load
cacheRole(user.email, roleObj);

// Live update UI after fetch
adminRoleEl.textContent =
  CURRENT_ROLE === "SuperAccount" && IS_PRIMARY
    ? "SuperAccount (Primary)"
    : CURRENT_ROLE;

applyRoleVisibility();


  if (!["Admin", "SuperAdmin", "SuperAccount"].includes(CURRENT_ROLE)) {
    alert("Access denied");
    return location.href = "home.html";
  }

  adminEmailEl.textContent = user.email;
  adminRoleEl.textContent =
    CURRENT_ROLE === "SuperAccount" && IS_PRIMARY
      ? "SuperAccount (Primary)"
      : CURRENT_ROLE;

  applyRoleVisibility();
  setupRoleDropdown();
  setupPrimaryWarning();
  setupDayFilter();
  setupEventFilter();
  setupPassesSheet();

  
loadDashboardStats();
  updateOfflineCount();
  startAutoRefresh();
});
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  // Open / Close menu
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  // Close on clicking a link
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => menu.classList.remove("active"));
  });
}
/* ================= VISIBILITY ================= */
function applyRoleVisibility() {
  overallStatsSection.classList.add("hidden");
  cardTotalReg.classList.add("hidden");
  cardMoney.classList.add("hidden");
  passStatsSection.classList.add("hidden");
  roleSection.classList.add("hidden");
// Accommodation control only for SuperAccount / SuperAdmin
accControlSection.classList.add("hidden");

if (CURRENT_ROLE === "SuperAccount") {
  accControlSection.classList.remove("hidden");
}

  if (CURRENT_ROLE === "Admin") return;

  overallStatsSection.classList.remove("hidden");
  passStatsSection.classList.remove("hidden");
  cardTotalReg.classList.remove("hidden");

  if (CURRENT_ROLE === "SuperAccount") {
    cardMoney.classList.remove("hidden");
    roleSection.classList.remove("hidden");
  }

  if (CURRENT_ROLE === "SuperAdmin") {
    roleSection.classList.remove("hidden");
  }
}

/* ================= ROLE DROPDOWN ================= */
function setupRoleDropdown() {
  roleSelect.innerHTML = "";
  roleSelect.add(new Option("Select Role", ""));

  // SuperAdmin: User ↔ Admin
  if (CURRENT_ROLE === "SuperAdmin") {
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("User", "USER"));
  }

  // SuperAccount (non primary)
  if (CURRENT_ROLE === "SuperAccount" && !IS_PRIMARY) {
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("SuperAdmin", "SuperAdmin"));
    roleSelect.add(new Option("User", "USER"));
  }

  // Primary SuperAccount
  if (CURRENT_ROLE === "SuperAccount" && IS_PRIMARY) {
    roleSelect.add(new Option("User", "USER"));
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("SuperAdmin", "SuperAdmin"));
    roleSelect.add(new Option("SuperAccount", "SuperAccount"));
    roleSelect.add(new Option("Transfer Primary", "TRANSFER_PRIMARY"));
  }
}

/* ================= PRIMARY WARNING ================= */
function setupPrimaryWarning() {
  roleSelect.addEventListener("change", () => {
    primaryWarning.classList.toggle(
      "hidden",
      roleSelect.value !== "TRANSFER_PRIMARY"
    );
  });
}

/* ================= ROLE ASSIGN ================= */
saveRoleBtn.onclick = async () => {
  const targetEmail = roleEmailInput.value.trim().toLowerCase();
  const role = roleSelect.value;

  if (!targetEmail || !role) {
    alert("Email and role required");
    return;
  }

  const payload =
    role === "TRANSFER_PRIMARY"
      ? {
          type: "TRANSFER_PRIMARY",
          requesterEmail: auth.currentUser.email,
          targetEmail
        }
      : {
          type: "ASSIGN_ROLE",
          requesterEmail: auth.currentUser.email,
          targetEmail,
          newRole: role
        };

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const r = await res.json();
  alert(r.message || r.error || "Updated");

  // RESET UI
  roleEmailInput.value = "";
  roleSelect.value = "";
  primaryWarning.classList.add("hidden");
};

/* ================= FILTERS ================= */
function setupDayFilter() {
  // Main dashboard day filter
  if (dayDropdown) {
    dayDropdown.addEventListener("change", () => {
      CURRENT_DAY = dayDropdown.value || "";
      loadDashboardStats();
    });
  }

  // Accommodation stats day filter
  if (accDayDropdown) {
    accDayDropdown.addEventListener("change", () => {
      CURRENT_ACC_DAY = accDayDropdown.value || "";

      if (!CURRENT_ACC_DAY) {
        accBoysSingle.textContent = "0 / 0";
        accBoysCommon.textContent = "0 / 0";
        accGirlsSingle.textContent = "0 / 0";
        accGirlsCommon.textContent = "0 / 0";
        return;
      }

      loadAccommodationStats();
    });
  }

  // Capacity control day dropdown
  async function loadCapacityForFilter() {
  const day = accControlDay.value;
  if (!day) return;

  const gender = accGenderFilter.value; // boys / girls
  const room = accRoomFilter.value;     // single / common

  const res = await fetch(`${API}?type=accommodationStats&day=${day}`);
  const d = await res.json();

  accCapacityInput.value = d[gender][room].total || 0;
}

accControlDay.addEventListener("change", loadCapacityForFilter);
accGenderFilter.addEventListener("change", loadCapacityForFilter);
accRoomFilter.addEventListener("change", loadCapacityForFilter);

}


async function setupEventFilter() {
  const res = await fetch(`${API}?type=eventList`);
  const events = await res.json();

  eventDropdown.innerHTML = `<option value="">Select Event</option>`;
  events.forEach(e => eventDropdown.add(new Option(e, e)));

  eventDropdown.addEventListener("change", () => {
    CURRENT_EVENT = eventDropdown.value;
    openEventRegSheet.classList.toggle("hidden", !CURRENT_EVENT);
    openEventEntrySheet.classList.toggle("hidden", !CURRENT_EVENT);
    loadDashboardStats();
  });
}
function updateCircle(circleId, used, total) {
  const circle = document.getElementById(circleId);
  const text = circle.querySelector(".circle-text");

  const percent = total === 0 ? 0 : Math.round((used / total) * 100);

  // Circle math
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const progressCircle = circle.querySelector(".progress");
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = offset;

  text.textContent = `${used}/${total}`;
}

/* ================= STATS ================= */
async function loadAccommodationStats() {
  if (!CURRENT_ACC_DAY) return;

  try {
    const res = await fetch(`${API}?type=accommodationStats&day=${CURRENT_ACC_DAY}`);
    const d = await res.json();

    // TEXT (optional if you still want)
    accBoysSingle.textContent = `${d.boys.single.used} / ${d.boys.single.total}`;
    accBoysCommon.textContent = `${d.boys.common.used} / ${d.boys.common.total}`;
    accGirlsSingle.textContent = `${d.girls.single.used} / ${d.girls.single.total}`;
    accGirlsCommon.textContent = `${d.girls.common.used} / ${d.girls.common.total}`;

    // 🔵 UPDATE CIRCLES
    updateCircle("boysSingleCircle", d.boys.single.used, d.boys.single.total);
    updateCircle("boysCommonCircle", d.boys.common.used, d.boys.common.total);
    updateCircle("girlsSingleCircle", d.girls.single.used, d.girls.single.total);
    updateCircle("girlsCommonCircle", d.girls.common.used, d.girls.common.total);

  } catch (e) {
    console.error("Accommodation stats error", e);
  }
}

// ================= SAVE ACCOMMODATION CAPACITY =================
if (saveAccCapacity) {
  saveAccCapacity.onclick = async () => {
    if (!accControlDay.value) {
      return alert("Select day first");
    }

    const gender = accGenderFilter.value; // boys/girls
const room = accRoomFilter.value;     // single/common
const total = Number(accCapacityInput.value || 0);

const payload = {
  type: "setAccommodationCapacity",
  day: accControlDay.value,
  gender,
  room,
  total,
  email: auth.currentUser.email
};


    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const r = await res.json();
    alert(r.message || "Capacity saved");

    if (CURRENT_ACC_DAY === accControlDay.value) {
      loadAccommodationStats();
    }
  };
}



function applyStatsToUI(d){
  statTotalReg.textContent = d.totalRegistrations ?? "—";
  statScan.textContent     = d.scansToday ?? "—";
  statMoney.textContent    = d.totalAmount != null ? `₹${d.totalAmount}` : "—";

  eventCountEl.textContent = CURRENT_EVENT ? (d.eventRegistrations ?? 0) : "—";

  statInCampus.innerHTML = `Live: <b>${d.insideCampus?.live ?? 0}</b><br>Max: <b>${d.insideCampus?.max ?? 0}</b>`;
  statAccommodation.innerHTML = `Live: <b>${d.accommodation?.live ?? 0}</b><br>Max: <b>${d.accommodation?.max ?? 0}</b>`;

  if(CURRENT_ROLE !== "Admin" && d.passes){
    passDay.textContent     = d.passes.day ?? "—";
    passFest.textContent    = d.passes.fest ?? "—";
    passStar.textContent    = d.passes.starnite ?? "—";
    passVisitor.textContent = d.passes.visitor ?? "—";
  }
}


/* ================= AUTO REFRESH ================= */
function startAutoRefresh() {
  if (REFRESH_TIMER) clearInterval(REFRESH_TIMER);
  REFRESH_TIMER = setInterval(loadDashboardStats, 60000);   // every 1 min

  // Extra: refresh once when tab becomes visible
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState === "visible"){
      loadDashboardStats();
    }
  });
}


/* ================= PASSES SHEET ================= */
function setupPassesSheet() {
 openPassesSheet.onclick = async () => {
  const email = auth.currentUser.email;
  const r = await fetch(`${API}?type=openPassesSheet&email=${encodeURIComponent(email)}`);
  const d = await r.json();

  if (d.url) window.open(d.url, "_blank");
  else alert(d.error || "Not allowed");
};


}
openEventRegSheet.onclick = async () => {
  if (!CURRENT_EVENT) return;

  const email = auth.currentUser.email;
  const r = await fetch(`${API}?type=openEventRegSheet&event=${CURRENT_EVENT}&email=${encodeURIComponent(email)}`);
  const d = await r.json();

  if (d.url) window.open(d.url, "_blank");
  else alert(d.error || "Not allowed");
};

openEventEntrySheet.onclick = async () => {
  if (!CURRENT_EVENT) return;

  const email = auth.currentUser.email;
  const r = await fetch(`${API}?type=openEventEntrySheet&event=${CURRENT_EVENT}&email=${encodeURIComponent(email)}`);
  const d = await r.json();

  if (d.url) window.open(d.url, "_blank");
  else alert(d.error || "Not allowed");
};
openGateLogsSheet.onclick = async () => {
  const email = auth.currentUser.email;
  const r = await fetch(`${API}?type=openGateLogsSheet&email=${encodeURIComponent(email)}`);
  const d = await r.json();

  if (d.url) window.open(d.url, "_blank");
  else alert(d.error || "Not allowed");
};



/* ================= SEARCH ================= */
searchBtn.onclick = async () => {
  const q = searchInput.value.trim();
  if (!q) return;

  const r = await fetch(`${API}?type=searchPass&query=${encodeURIComponent(q)}`);
  const rows = await r.json();

  if (!rows.length) {
    searchResults.innerHTML = "<p>No results found</p>";
    return;
  }

  let html = `<table><tr>
    <th>Name</th><th>Email</th><th>Phone</th>
    <th>College</th><th>Payment ID</th><th>Pass</th><th>QR</th>
  </tr>`;

  rows.forEach((x, i) => {
    const adminEmail = auth.currentUser.email;

html += `<tr>
  <td>${x.Name}</td>
  <td>${x.Email}</td>
  <td>${x.Phone}</td>
  <td>${x.College}</td>
  <td>${x["Payment ID"]}</td>
  <td>${x["Pass Type"]}</td>
  <td>
    <div
      class="qr-box"
      id="qr-${i}"
      data-qr="${FRONTEND_BASE}/public.html?paymentId=${encodeURIComponent(x["Payment ID"])}"
data-scan="${FRONTEND_BASE}/scan.html?paymentId=${encodeURIComponent(x["Payment ID"])}&scanner=${encodeURIComponent(adminEmail)}"

    ></div>
  </td>
</tr>`;

  });

  html += "</table>";
  searchResults.innerHTML = html;

  rows.forEach((x, i) => {
  const el = document.getElementById(`qr-${i}`);

  const publicUrl = el.dataset.qr;     // what QR encodes
  const scanUrl   = el.dataset.scan;   // what admin click opens

  el.innerHTML = "";

  const qr = new QRCode(el, {
    width: 110,
    height: 110,
    correctLevel: QRCode.CorrectLevel.L
  });

  // ✅ QR ALWAYS opens public.html
  qr.makeCode(publicUrl);

  // ✅ Admin click opens scan.html
  el.onclick = () => {
    window.open(scanUrl, "_blank", "noopener,noreferrer");
  };
});

};

/* ================= OFFLINE ================= */
function updateOfflineCount() {
  const q = JSON.parse(localStorage.getItem("offlineScans") || "[]");
  offlineCountEl.textContent = q.length;
}
/* ================= SCANNER BUTTON ================= */
document.addEventListener("DOMContentLoaded", () => {
  const openScannerBtn = document.getElementById("openScannerBtn");

  if (!openScannerBtn) {
    console.error("Open Scanner button not found in DOM");
    return;
  }

  openScannerBtn.addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login again");
      location.href = "login.html";
      return;
    }
    const scannerUrl =
  `scan.html?scanner=` +
  encodeURIComponent(user.email);

window.location.href = scannerUrl;

  });
});

/* ================= LOGOUT ================= */
document.getElementById("logoutDesktop").onclick = logout;
document.getElementById("logoutMobile").onclick = logout;

async function logout() {
  const email = auth.currentUser?.email;
  if(email){
    clearRoleCache(email);
  }
  clearDashboardCache();
  localStorage.removeItem("pravaah_dashboard"); 
  await signOut(auth);
  location.href = "login.html";
}


/* ============================================================
   📌 LOCAL CACHE SYSTEM for DASHBOARD (Stats + Pass Counts)
============================================================ */

function cacheDashboard(data){
  localStorage.setItem("pravaah_dashboard", JSON.stringify({
    time: Date.now(),
    data
  }));
}

function getCachedDashboard(){
  let x = localStorage.getItem("pravaah_dashboard");
  return x ? JSON.parse(x).data : null;
}

function clearDashboardCache(){
  localStorage.removeItem("pravaah_dashboard");
}
/* ============================================================
   📌 LOCAL CACHE SYSTEM FOR ADMIN ROLE (Instant UI Load)
============================================================ */

function cacheRole(email, roleObj){
  localStorage.setItem("pravaah_role_" + email, JSON.stringify(roleObj));
}

function getCachedRole(email){
  let r = localStorage.getItem("pravaah_role_" + email);
  return r ? JSON.parse(r) : null;
}

function clearRoleCache(email){
  localStorage.removeItem("pravaah_role_" + email);
}

/* ============================================================
   PRAVAAH — ADMIN DASHBOARD LOGIC (FINAL, ROLE SAFE)
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

const cardTotalReg = document.getElementById("cardTotalReg");
const cardMoney = document.getElementById("cardMoney");
const passStatsSection = document.getElementById("passStatsSection");

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

const roleSection = document.getElementById("roleSection");
const roleSelect = document.getElementById("roleSelect");
const primaryWarning = document.getElementById("primaryWarning");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

const offlineCountEl = document.getElementById("offlineCount");

/* ================= STATE ================= */
let CURRENT_ROLE = "";
let IS_PRIMARY = false;
let CURRENT_DAY = "";
let CURRENT_EVENT = "";
let REFRESH_TIMER = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const roleRes = await fetch(
    `${API}?type=role&email=${encodeURIComponent(user.email)}`
  );
  const roleObj = await roleRes.json();

  CURRENT_ROLE = roleObj.role;
  IS_PRIMARY = roleObj.isPrimary === true;

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

  await loadDashboardStats();
  updateOfflineCount();
  startAutoRefresh();
});

/* ================= ROLE VISIBILITY ================= */
function applyRoleVisibility() {
  cardTotalReg.classList.add("hidden");
  cardMoney.classList.add("hidden");
  roleSection.classList.add("hidden");
  passStatsSection.classList.add("hidden");

  if (CURRENT_ROLE === "Admin") return;

  passStatsSection.classList.remove("hidden");

  if (CURRENT_ROLE === "SuperAdmin") {
    cardTotalReg.classList.remove("hidden");
    roleSection.classList.remove("hidden");
    return;
  }

  if (CURRENT_ROLE === "SuperAccount") {
    cardTotalReg.classList.remove("hidden");
    cardMoney.classList.remove("hidden");
    roleSection.classList.remove("hidden");
  }
}

/* ================= ROLE DROPDOWN OPTIONS ================= */
function setupRoleDropdown() {
  if (!roleSelect) return;

  roleSelect.innerHTML = "";

  if (CURRENT_ROLE === "SuperAdmin") {
    roleSelect.add(new Option("Admin", "Admin"));
  }

  if (CURRENT_ROLE === "SuperAccount") {
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("SuperAdmin", "SuperAdmin"));

    if (IS_PRIMARY) {
      roleSelect.add(new Option("Transfer Primary", "TRANSFER_PRIMARY"));
    }
  }
}

/* ================= PRIMARY WARNING ================= */
function setupPrimaryWarning() {
  roleSelect?.addEventListener("change", () => {
    primaryWarning.classList.toggle(
      "hidden",
      roleSelect.value !== "TRANSFER_PRIMARY"
    );
  });
}

/* ================= FILTERS ================= */
function setupDayFilter() {
  dayDropdown.addEventListener("change", () => {
    CURRENT_DAY = dayDropdown.value || "";
    loadDashboardStats();
  });
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

/* ================= DASHBOARD STATS ================= */
async function loadDashboardStats() {
  const qs = new URLSearchParams({
    type: "dashboardStats",
    day: CURRENT_DAY,
    event: CURRENT_EVENT,
    role: CURRENT_ROLE
  });

  const res = await fetch(`${API}?${qs}`);
  const d = await res.json();

  statTotalReg.textContent = d.totalRegistrations ?? "—";
  statScan.textContent = d.scansToday ?? "—";
  statMoney.textContent = d.totalAmount != null ? `₹${d.totalAmount}` : "—";

  eventCountEl.textContent = CURRENT_EVENT ? (d.eventRegistrations ?? 0) : "—";

  statInCampus.innerHTML = `Live: <b>${d.insideCampus?.live ?? 0}</b><br>Max: <b>${d.insideCampus?.max ?? 0}</b>`;
  statAccommodation.innerHTML = `Live: <b>${d.accommodation?.live ?? 0}</b><br>Max: <b>${d.accommodation?.max ?? 0}</b>`;

  if (d.passes && CURRENT_ROLE !== "Admin") {
    passDay.textContent = d.passes.day ?? "—";
    passFest.textContent = d.passes.fest ?? "—";
    passStar.textContent = d.passes.starnite ?? "—";
    passVisitor.textContent = d.passes.visitor ?? "—";
  }
}

/* ================= AUTO REFRESH ================= */
function startAutoRefresh() {
  if (REFRESH_TIMER) clearInterval(REFRESH_TIMER);
  REFRESH_TIMER = setInterval(loadDashboardStats, 30000);
}

/* ================= PASSES SHEET ================= */
function setupPassesSheet() {
  openPassesSheet.onclick = async () => {
    const res = await fetch(`${API}?type=openPassesSheet`);
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
  };
}

/* ================= SEARCH ================= */
searchBtn.addEventListener("click", async () => {
  const q = searchInput.value.trim();
  if (!q) return;

  const res = await fetch(`${API}?type=searchPass&query=${encodeURIComponent(q)}`);
  const rows = await res.json();

  if (!rows.length) {
    searchResults.innerHTML = "<p>No results found</p>";
    return;
  }

  let html = `<table><tr>
    <th>Name</th><th>Email</th><th>Phone</th>
    <th>College</th><th>Payment ID</th><th>Pass</th><th>QR</th>
  </tr>`;

  rows.forEach((r, i) => {
    html += `<tr>
      <td>${r.Name}</td>
      <td>${r.Email}</td>
      <td>${r.Phone}</td>
      <td>${r.College}</td>
      <td>${r["Payment ID"]}</td>
      <td>${r["Pass Type"]}</td>
      <td><div id="qr-${i}"></div></td>
    </tr>`;
  });

  html += "</table>";
  searchResults.innerHTML = html;

  rows.forEach((r, i) => {
    new QRCode(document.getElementById(`qr-${i}`), {
      text: `${API}?mode=admin&page=scan&paymentId=${r["Payment ID"]}`,
      width: 64,
      height: 64
    });
  });
});

/* ================= OFFLINE ================= */
function updateOfflineCount() {
  const q = JSON.parse(localStorage.getItem("offlineScans") || "[]");
  offlineCountEl.textContent = q.length;
}

/* ================= LOGOUT ================= */
document.getElementById("logoutDesktop").onclick = logout;
document.getElementById("logoutMobile").onclick = logout;

async function logout() {
  await signOut(auth);
  location.href = "login.html";
}

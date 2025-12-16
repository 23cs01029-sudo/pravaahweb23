/* ============================================================
   PRAVAAH — ADMIN DASHBOARD LOGIC (FINAL COMPLETE)
   Role Matrix + Day/Event + Search + Sheets
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ================= BACKEND ================= */
const API =
  "https://script.google.com/macros/s/AKfycbxTtdt1HmTIP0i5WOeXMLRWLKA1k4RpD153EmgU-Ow6CPRGOISzjOVLplKFDm-gUaggmg/exec";

/* ================= DOM ================= */
const adminEmailEl = document.getElementById("adminEmail");
const adminRoleEl  = document.getElementById("adminRole");

/* Cards */
const cardTotalReg = document.getElementById("cardTotalReg");
const cardMoney    = document.getElementById("cardMoney");

/* Stats */
const statTotalReg      = document.getElementById("statTotalReg");
const statEventReg      = document.getElementById("statEventReg");
const statAccommodation = document.getElementById("statAccommodation");
const statInCampus      = document.getElementById("statInCampus");
const statScan          = document.getElementById("statScan");
const statMoney         = document.getElementById("statMoney");

/* Filters */
const dayDropdown   = document.getElementById("dayDropdown");
const eventDropdown = document.getElementById("eventDropdown");

/* Event UI */
const eventCountEl = document.getElementById("eventCount");
const openEventSheetBtn = document.getElementById("openEventSheetBtn");

/* Search */
const searchInput   = document.getElementById("searchInput");
const searchBtn     = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

/* Role */
const roleSection = document.getElementById("roleSection");
const roleEmail   = document.getElementById("roleEmail");
const roleSelect  = document.getElementById("roleSelect");
const roleSaveBtn = document.getElementById("saveRoleBtn");

/* Offline */
const offlineCountEl = document.getElementById("offlineCount");

/* ================= STATE ================= */
let CURRENT_ROLE  = "";
let CURRENT_DAY   = "";
let CURRENT_EVENT = "";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const res = await fetch(
    `${API}?type=role&email=${encodeURIComponent(user.email)}`
  );
  const roleObj = await res.json();

  CURRENT_ROLE = roleObj.role;

  if (!["Admin","SuperAdmin","SuperAccount","PrimarySuperAccount"]
    .includes(CURRENT_ROLE)) {
    alert("Access denied");
    return location.href = "home.html";
  }

  adminEmailEl.textContent = user.email;
  adminRoleEl.textContent  = CURRENT_ROLE;

  applyRoleVisibility();
  loadDayFilter();
  loadEventFilter();
  loadDashboardStats();
  updateOfflineCount();
});

/* ================= ROLE VISIBILITY ================= */
function applyRoleVisibility() {
  if (CURRENT_ROLE === "Admin") {
    cardTotalReg?.classList.add("hidden");
    cardMoney?.classList.add("hidden");
  }

  if (CURRENT_ROLE === "SuperAdmin") {
    cardMoney?.classList.add("hidden");
  }
}

/* ================= DAY FILTER ================= */
function loadDayFilter() {
  if (!dayDropdown || CURRENT_ROLE === "Admin") return;

  dayDropdown.addEventListener("change", () => {
    CURRENT_DAY = dayDropdown.value;
    loadDashboardStats();
  });
}

/* ================= EVENT FILTER ================= */
async function loadEventFilter() {
  const res = await fetch(`${API}?type=eventList`);
  const events = await res.json();

  eventDropdown.innerHTML = `<option value="">All Events</option>`;
  events.forEach(ev => eventDropdown.add(new Option(ev, ev)));

  eventDropdown.addEventListener("change", () => {
    CURRENT_EVENT = eventDropdown.value;
    loadDashboardStats();
    updateEventSheetButton();
  });
}

/* ================= DASHBOARD STATS ================= */
async function loadDashboardStats() {
  const qs = new URLSearchParams({
    type: "dashboardStats",
    day: CURRENT_DAY,
    event: CURRENT_EVENT
  });

  const res = await fetch(`${API}?${qs}`);
  const d = await res.json();

  statTotalReg.textContent      = d.totalRegistrations ?? "--";
  statEventReg.textContent      = d.eventRegistrations ?? "--";
  statAccommodation.textContent = d.accommodation ?? "--";
  statInCampus.textContent      = d.inCampus ?? "--";
  statScan.textContent          = d.scansToday ?? "--";

  if (statMoney) statMoney.textContent = d.totalAmount ?? "--";

  if (eventCountEl)
    eventCountEl.textContent = d.eventRegistrations ?? "0";
}

/* ================= EVENT SHEET OPEN ================= */
function updateEventSheetButton() {
  if (!CURRENT_EVENT) {
    openEventSheetBtn.style.display = "none";
    return;
  }

  openEventSheetBtn.style.display = "inline-flex";
  openEventSheetBtn.onclick = () => {
    window.open(
      `${API}?type=openEventSheet&event=${encodeURIComponent(CURRENT_EVENT)}`,
      "_blank"
    );
  };
}

/* ================= SEARCH ================= */
searchBtn?.addEventListener("click", async () => {
  const q = searchInput.value.trim();
  if (!q) return;

  const res = await fetch(
    `${API}?type=searchPass&query=${encodeURIComponent(q)}`
  );
  const rows = await res.json();

  if (!rows.length) {
    searchResults.innerHTML = "<p>No results found</p>";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Name</th><th>Email</th><th>Phone</th>
        <th>College</th><th>Payment ID</th><th>Pass Type</th>
      </tr>`;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.Name}</td>
        <td>${r.Email}</td>
        <td>${r.Phone}</td>
        <td>${r.College}</td>
        <td>${r["Payment ID"]}</td>
        <td>${r["Pass Type"]}</td>
      </tr>`;
  });

  html += "</table>";
  searchResults.innerHTML = html;
});

/* ================= ROLE MANAGEMENT ================= */
function configureRoleUI() {
  if (CURRENT_ROLE === "Admin") {
    roleSection.classList.add("hidden");
    return;
  }

  roleSelect.innerHTML = "";

  if (CURRENT_ROLE === "SuperAdmin") {
    roleSelect.add(new Option("Admin", "Admin"));
  }

  if (CURRENT_ROLE === "SuperAccount") {
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("SuperAdmin", "SuperAdmin"));
  }

  if (CURRENT_ROLE === "PrimarySuperAccount") {
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("SuperAdmin", "SuperAdmin"));
    roleSelect.add(new Option("SuperAccount", "SuperAccount"));
    roleSelect.add(new Option("Transfer Primary", "TRANSFER_PRIMARY"));
  }
}

roleSaveBtn?.addEventListener("click", async () => {
  if (!roleEmail.value || !roleSelect.value) return;

  await fetch(API, {
    method: "POST",
     mode: "no-cors",
    body: JSON.stringify({
      type: "setRole",
      targetEmail: roleEmail.value.trim(),
      newRole: roleSelect.value
    })
  });

  alert("Role updated");
  if (roleSelect.value === "TRANSFER_PRIMARY") location.reload();
});

/* ================= SCAN ================= */
window.openScanner = () => {
  location.href = `${API}?mode=admin&page=scan&scanner=dashboard`;
};

/* ================= OFFLINE ================= */
function updateOfflineCount() {
  const q = JSON.parse(localStorage.getItem("offlineScans") || "[]");
  offlineCountEl.textContent = q.length;
}

/* ================= LOGOUT ================= */
document.getElementById("logoutDesktop")?.addEventListener("click", logout);
document.getElementById("logoutMobile")?.addEventListener("click", logout);

async function logout() {
  await signOut(auth);
  location.href = "login.html";
}

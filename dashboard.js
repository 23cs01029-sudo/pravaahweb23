/* ============================================================
   PRAVAAH — ADMIN DASHBOARD LOGIC (FINAL, STABLE)
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
  projectId: "pravaah-55b1d",
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

const statTotalReg = document.getElementById("statTotalReg");
const statEventReg = document.getElementById("statEventReg");
const statAccommodation = document.getElementById("statAccommodation");
const statInCampus = document.getElementById("statInCampus");
const statScan = document.getElementById("statScan");
const statMoney = document.getElementById("statMoney");

const dayDropdown = document.getElementById("dayDropdown");
const eventDropdown = document.getElementById("eventDropdown");

const eventCountEl = document.getElementById("eventCount");
const openEventSheetBtn = document.getElementById("openEventSheetBtn");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

const roleSection = document.getElementById("roleSection");
const roleEmail = document.getElementById("roleEmail");
const roleSelect = document.getElementById("roleSelect");
const roleSaveBtn = document.getElementById("saveRoleBtn");
const primaryWarning = document.getElementById("primaryWarning");

const offlineCountEl = document.getElementById("offlineCount");

/* ================= STATE ================= */
let CURRENT_ROLE = "";
let IS_PRIMARY = false;
let CURRENT_DAY = "";     // "" = ALL DAYS
let CURRENT_EVENT = "";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return (location.href = "login.html");

  const roleRes = await fetch(
    `${API}?type=role&email=${encodeURIComponent(user.email)}`
  );
  const roleObj = await roleRes.json();

  CURRENT_ROLE = roleObj.role;
  IS_PRIMARY = roleObj.isPrimary === true;

  if (!["Admin", "SuperAdmin", "SuperAccount"].includes(CURRENT_ROLE)) {
    alert("Access denied");
    return (location.href = "home.html");
  }

  adminEmailEl.textContent = user.email;
  adminRoleEl.textContent =
    CURRENT_ROLE === "SuperAccount" && IS_PRIMARY
      ? "SuperAccount (Primary)"
      : CURRENT_ROLE;

  applyRoleVisibility();
  configureRoleUI();
  setupPrimaryWarning();
  setupDayFilter();
  setupEventFilter();
  loadDashboardStats();
  updateOfflineCount();
});

/* ================= ROLE VISIBILITY ================= */
function applyRoleVisibility() {
  if (CURRENT_ROLE === "Admin") {
    cardTotalReg?.classList.add("hidden");
    cardMoney?.classList.add("hidden");
    roleSection?.classList.add("hidden");
  }

  if (CURRENT_ROLE === "SuperAdmin") {
    cardMoney?.classList.add("hidden");
    roleSection?.classList.add("hidden");
  }

  if (CURRENT_ROLE === "SuperAccount" && IS_PRIMARY) {
    cardTotalReg?.classList.remove("hidden");
    cardMoney?.classList.remove("hidden");
    roleSection?.classList.remove("hidden");
  }
}

/* ================= ROLE UI ================= */
function configureRoleUI() {
  roleSelect.innerHTML = "";

  if (CURRENT_ROLE === "SuperAdmin") {
    roleSelect.add(new Option("Admin", "Admin"));
  }

  if (CURRENT_ROLE === "SuperAccount" && !IS_PRIMARY) {
    roleSelect.add(new Option("Admin", "Admin"));
    roleSelect.add(new Option("SuperAdmin", "SuperAdmin"));
  }

  if (CURRENT_ROLE === "SuperAccount" && IS_PRIMARY) {
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

/* ================= DAY FILTER ================= */
function setupDayFilter() {
  if (CURRENT_ROLE === "Admin") {
    document.getElementById("dayFilter")?.classList.add("hidden");
    return;
  }

  dayDropdown.addEventListener("change", () => {
    CURRENT_DAY = dayDropdown.value === "ALL" ? "" : dayDropdown.value;
    loadDashboardStats();
  });
}

/* ================= EVENT FILTER ================= */
async function setupEventFilter() {
  const res = await fetch(`${API}?type=eventList`);
  const events = await res.json();

  eventDropdown.innerHTML = `<option value="">All Events</option>`;
  events.forEach(e => eventDropdown.add(new Option(e, e)));

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
    event: CURRENT_EVENT,
    role: CURRENT_ROLE
  });

  const res = await fetch(`${API}?${qs}`);
  const d = await res.json();

  statTotalReg.textContent = d.totalRegistrations ?? "--";
  statEventReg.textContent = d.eventRegistrations ?? "--";
  eventCountEl.textContent = d.eventRegistrations ?? "0";

  statInCampus.innerHTML = `
    Live: <b>${d.insideCampus?.live ?? 0}</b><br>
    Max: <b>${d.insideCampus?.max ?? 0}</b><br>
    Unique: <b>${d.insideCampus?.unique ?? 0}</b>
  `;

  statAccommodation.innerHTML = `
    Live: <b>${d.accommodation?.live ?? 0}</b><br>
    Max: <b>${d.accommodation?.max ?? 0}</b><br>
    Unique: <b>${d.accommodation?.unique ?? 0}</b>
  `;

  statScan.textContent = d.scansToday ?? "--";
  statMoney.textContent =
    d.totalAmount != null ? `₹${d.totalAmount}` : "--";
}

/* ================= EVENT SHEET ================= */
function updateEventSheetButton() {
  if (!CURRENT_EVENT) {
    openEventSheetBtn.classList.add("hidden");
    return;
  }

  openEventSheetBtn.classList.remove("hidden");
  openEventSheetBtn.onclick = async () => {
    const res = await fetch(
      `${API}?type=openEventSheet&event=${encodeURIComponent(CURRENT_EVENT)}`
    );
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
  };
}

/* ================= SEARCH ================= */
searchBtn.addEventListener("click", async () => {
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
        <th>College</th><th>Payment ID</th><th>Pass</th><th>QR</th>
      </tr>`;

  rows.forEach((r, i) => {
    html += `
      <tr>
        <td>${r.Name}</td>
        <td>${r.Email}</td>
        <td>${r.Phone}</td>
        <td>${r.College}</td>
        <td>${r["Payment ID"]}</td>
        <td>${r["Pass Type"]}</td>
        <td><div id="qr-${i}" style="cursor:pointer"></div></td>
      </tr>`;
  });

  html += "</table>";
  searchResults.innerHTML = html;

  rows.forEach((r, i) => {
    const url =
      `${API}?mode=admin&page=scan&scanner=dashboard&paymentId=${encodeURIComponent(
        r["Payment ID"]
      )}`;

    const box = document.getElementById(`qr-${i}`);
    box.onclick = () => window.open(url, "_blank");

    new QRCode(box, {
      text: url,
      width: 64,
      height: 64,
      correctLevel: QRCode.CorrectLevel.H
    });
  });
});

/* ================= ROLE SAVE ================= */
roleSaveBtn.addEventListener("click", async () => {
  if (!roleEmail.value || !roleSelect.value) return;

  await fetch(API, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type:
        roleSelect.value === "TRANSFER_PRIMARY"
          ? "TRANSFER_PRIMARY"
          : "setRole",
      requesterEmail: adminEmailEl.textContent,
      targetEmail: roleEmail.value.trim(),
      newRole: roleSelect.value
    })
  });

  alert("Role updated");
  location.reload();
});

/* ================= SCANNER ================= */
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

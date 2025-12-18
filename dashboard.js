/* ============================================================
   PRAVAAH — ADMIN DASHBOARD LOGIC (FINAL + ROLE CORRECT)
============================================================ */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const GAS_PAGE =
  "https://script.google.com/macros/s/AKfycbwiLk2g-bLC-6tAtynkQw1GSuPcVzqzBoLah9LYMxL3kR1Wh9r6DK7R0UU_wizPdXcxaA/exec";

const auth = getAuth(app);
function getCachedRole(email) {
  const r = sessionStorage.getItem("PRAVAAH_ROLE");
  if (!r) return null;
  const o = JSON.parse(r);
  return o.email === email ? o : null;
}

function setCachedRole(email, role, isPrimary) {
  sessionStorage.setItem(
    "PRAVAAH_ROLE",
    JSON.stringify({ email, role, isPrimary, ts: Date.now() })
  );
}

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

/* ================= STATE ================= */
let CURRENT_ROLE = "USER";
let IS_PRIMARY = false;
let CURRENT_DAY = "";
let CURRENT_EVENT = "";
let REFRESH_TIMER = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const cached = getCachedRole(user.email);

if (cached) {
  CURRENT_ROLE = cached.role;
  IS_PRIMARY = cached.isPrimary;
} else {
  const r = await fetch(`${API}?type=role&email=${encodeURIComponent(user.email)}`);
  const roleObj = await r.json();
  CURRENT_ROLE = roleObj?.role || "USER";
  IS_PRIMARY = roleObj?.isPrimary === true;
  setCachedRole(user.email, CURRENT_ROLE, IS_PRIMARY);
}


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

/* ================= VISIBILITY ================= */
function applyRoleVisibility() {
  overallStatsSection.classList.add("hidden");
  cardTotalReg.classList.add("hidden");
  cardMoney.classList.add("hidden");
  passStatsSection.classList.add("hidden");
  roleSection.classList.add("hidden");

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

/* ================= STATS ================= */
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

  if (CURRENT_ROLE !== "Admin" && d.passes) {
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
    const r = await fetch(`${API}?type=openPassesSheet`);
    const d = await r.json();
    if (d.url) window.open(d.url, "_blank");
  };
}
openEventRegSheet.onclick = async () => {
  if (!CURRENT_EVENT) return;
  const r = await fetch(`${API}?type=openEventRegSheet&event=${CURRENT_EVENT}`);
  const d = await r.json();
  if (d.url) window.open(d.url, "_blank");
};

openEventEntrySheet.onclick = async () => {
  if (!CURRENT_EVENT) return;
  const r = await fetch(`${API}?type=openEventEntrySheet&event=${CURRENT_EVENT}`);
  const d = await r.json();
  if (d.url) window.open(d.url, "_blank");
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
    html += `<tr>
      <td>${x.Name}</td>
      <td>${x.Email}</td>
      <td>${x.Phone}</td>
      <td>${x.College}</td>
      <td>${x["Payment ID"]}</td>
      <td>${x["Pass Type"]}</td>
      <td>
  <a href="${GAS_PAGE}?mode=admin&page=scan&paymentId=${x["Payment ID"]}" target="_blank">
    <div id="qr-${i}"></div>
  </a>
</td>

    </tr>`;
  });

  html += "</table>";
  searchResults.innerHTML = html;

  rows.forEach((x, i) => {
    new QRCode(document.getElementById(`qr-${i}`), {
  text: `${GAS_PAGE}?mode=admin&page=scan&paymentId=${x["Payment ID"]}`,
  width: 64,
  height: 64
});

  });
};

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
setInterval(async () => {
  if (!auth.currentUser) return;

  const r = await fetch(
    `${API}?type=role&email=${encodeURIComponent(auth.currentUser.email)}`
  );
  const roleObj = await r.json();

  if (!roleObj?.role) return;

  if (roleObj.role !== CURRENT_ROLE || roleObj.isPrimary !== IS_PRIMARY) {
    setCachedRole(auth.currentUser.email, roleObj.role, roleObj.isPrimary);

    if (!["Admin", "SuperAdmin", "SuperAccount"].includes(roleObj.role)) {
      alert("Your admin access has been revoked.");
      location.href = "home.html";
      return;
    }

    CURRENT_ROLE = roleObj.role;
    IS_PRIMARY = roleObj.isPrimary === true;
    applyRoleVisibility();
    loadDashboardStats();
  }
}, 60000); // every 60s

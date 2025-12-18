/* ============================================================
   PRAVAAH — ADMIN DASHBOARD LOGIC (FINAL + ROLE CORRECT)
============================================================ */
/* ================= BACKEND ================= */
/* ================= AUTH BRIDGE ================= */

// Wait until auth.js sets role
function waitForAuth() {
  return new Promise((resolve) => {
    if (window.PRAVAAH_AUTH?.role) return resolve();

    const i = setInterval(() => {
      if (window.PRAVAAH_AUTH?.role) {
        clearInterval(i);
        resolve();
      }
    }, 100);
  });
}

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
/* ================= STATE ================= */
let CURRENT_ROLE = "USER";
let IS_PRIMARY = false;
let CURRENT_DAY = "";
let CURRENT_EVENT = "";
let REFRESH_TIMER = null;
/* ================= BOOTSTRAP ================= */
(async () => {
  await waitForAuth();

  CURRENT_ROLE = window.PRAVAAH_AUTH.role;
  IS_PRIMARY = window.PRAVAAH_AUTH.isPrimary === true;

  // 🚫 Hard block non-admin
  if (!["Admin", "SuperAdmin", "SuperAccount"].includes(CURRENT_ROLE)) {
    alert("Access denied");
    location.href = "home.html";
    return;
  }

  // Show admin info
  document.getElementById("adminEmail").textContent =
    window.PRAVAAH_AUTH.email;

  document.getElementById("adminRole").textContent =
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
})();



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
/* ================= LIVE ROLE MONITOR ================= */
setInterval(() => {
  const newRole = window.PRAVAAH_AUTH?.role;

  if (!newRole) return;

  if (newRole !== CURRENT_ROLE) {
    // role changed while page open
    if (!["Admin", "SuperAdmin", "SuperAccount"].includes(newRole)) {
      alert("Your admin access has been revoked.");
      location.href = "home.html";
    } else {
      CURRENT_ROLE = newRole;
      IS_PRIMARY = window.PRAVAAH_AUTH.isPrimary === true;
      applyRoleVisibility();
      loadDashboardStats();
    }
  }
}, 5000); // check every 5s



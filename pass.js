const scriptURL = "https://script.google.com/macros/s/AKfycby4F5rBxS_-KLmP05Yqm-R7PmjIx9_7dMsa28D1xds3X2jWSMKini-AJ-1wgGR6EmvDlg/exec";

/* ------------------------------
   FIXED + CLEAN EVENTS LIST
------------------------------ */
const EVENTS = {
  day0: [],
  day1: ["Event 1", "Event 2", "Event 3"],
  day2: ["Event 1", "Event 2", "Event 3"],
  day3: ["Event 1", "Event 2", "Event 3"]
};

/* ------------------------------
   PRICES
------------------------------ */
const PRICES = {
  dayPass: {
    day0: 300,
    day1: 800,
    day2: 800,
    day3_normal: 800,
    day3_star: 1100
  },
  visitor: {
    day0: 400,
    day1: 500,
    day2: 500,
    day3_normal: 500,
    day3_star: 800
  },
  fest: { normal: 2000, star: 2500 },
  starnite: 300
};

/* ------------------------------
   FIREBASE INITIALIZATION
------------------------------ */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

let auth = window.auth;
if (!auth) {
  const firebaseConfig = {
    apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
    authDomain: "pravaah-55b1d.firebaseapp.com",
    projectId: "pravaah-55b1d",
    storageBucket: "pravaah-55b1d.appspot.com",
    messagingSenderId: "287687647267",
    appId: "1:287687647267:web:7aecd603ee202779b89196"
  };
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  window.auth = auth;
}

/* ------------------------------
   DOM ELEMENTS
------------------------------ */
const passCards = document.querySelectorAll(".pass-card");
const selectionArea = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const participantForm = document.getElementById("participantForm");
const numInput = document.getElementById("numParticipants");
const decBtn = document.getElementById("decPart");
const incBtn = document.getElementById("incPart");
const totalAmountEl = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");

/* ------------------------------
   STATE VARIABLES
------------------------------ */
let currentPassType = null;
let currentDay = null;
let currentVisitorDays = [];
let includeStarNite = false;
let participantsCount = 0;
let cachedProfile = {};
let currentTotal = 0;
let paying = false;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;
const RULEBOOK_URL = "rulebooks/sample.pdf";

/******************************
 * CACHE HELPERS
 ******************************/
function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem("profileData") || "{}"); }
  catch { return {}; }
}

function saveProfileCache(obj) {
  try { localStorage.setItem("profileData", JSON.stringify(obj || {})); } catch {}
}

/******************************
 * EVENT CARD RENDER (STAR-NITE STYLE)
 ******************************/
function renderEventRow(name, opt = {}) {
  const day = opt.dayKey || "";
  const safe = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const id = `${opt.idPrefix || "ev"}_${safe}`;

  return `
    <div class="toggle-card event-toggle" data-day="${day}" data-value="${escapeHtml(name)}">
      <div class="toggle-label">${escapeHtml(name)}</div>
      <div class="toggle-checkmark">✔</div>
    </div>
  `;
}

/******************************
 * ESCAPE HTML
 ******************************/
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/******************************
 * PASS CARD CLICK
 ******************************/
passCards.forEach(card => {
  card.addEventListener("click", () => {
    passCards.forEach(x => x.classList.remove("selected"));
    card.classList.add("selected");

    let t = card.dataset.type || card.textContent.trim();

    if (/day/i.test(t)) t = "Day Pass";
    else if (/visitor/i.test(t)) t = "Visitor Pass";
    else if (/fest/i.test(t)) t = "Fest Pass";
    else if (/star/i.test(t)) t = "Starnite Pass";

    currentPassType = t;
    currentDay = null;
    currentVisitorDays = [];
    includeStarNite = false;

    participantsCount = 0;
    numInput.value = 0;

    renderSelectionArea();
  });
});

/******************************
 * RENDER SELECTION AREA
 ******************************/
function renderSelectionArea() {
  selectionArea.classList.remove("hidden");
  selectedPassTxt.textContent = `Selected: ${currentPassType}`;
  participantForm.innerHTML = "";

  /* ---------- DAY PASS ---------- */
  if (currentPassType === "Day Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4 style="margin-bottom:18px;">Choose Day</h4>
        <div class="day-selector-row">
          <div class="day-card" data-day="day0">DAY 0</div>
          <div class="day-card" data-day="day1">DAY 1</div>
          <div class="day-card" data-day="day2">DAY 2</div>
          <div class="day-card" data-day="day3">DAY 3</div>
        </div>
      </div>
      <div id="dayEventsContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    document.querySelectorAll(".day-card").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".day-card").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        currentDay = btn.dataset.day;
        includeStarNite = false;
        renderDayEvents(currentDay);
        calculateTotal();
      });
    });
  }

  /* ---------- VISITOR PASS (STAR-NITE STYLE BUTTONS) ---------- */
  if (currentPassType === "Visitor Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4 style="margin-bottom:18px;">Choose Days to Visit</h4>
        <div class="visitor-days-col">
          <div class="visitor-day-card" data-day="day0">DAY 0</div>
          <div class="visitor-day-card" data-day="day1">DAY 1</div>
          <div class="visitor-day-card" data-day="day2">DAY 2</div>
          <div class="visitor-day-card" data-day="day3">DAY 3</div>
        </div>
      </div>
      <div id="visitorEventsContainer"></div>
      <div id="visitorStarContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    document.querySelectorAll(".visitor-day-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = btn.dataset.day;

        if (currentVisitorDays.includes(d)) {
          currentVisitorDays = currentVisitorDays.filter(x => x !== d);
          btn.classList.remove("active");
        } else {
          currentVisitorDays.push(d);
          btn.classList.add("active");
        }

        includeStarNite = false;
        renderVisitorEvents(currentVisitorDays);
        renderVisitorStarToggleIfNeeded();
        calculateTotal();
      });
    });
  }

  /* ---------- FEST PASS ---------- */
  if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4>Fest Pass — All Days Included</h4>
      </div>
      <div id="festEventsContainer"></div>
      <div id="festStarContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    renderFestEvents();
  }

  /* ---------- STARNITE PASS ---------- */
  if (currentPassType === "Starnite Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4>Starnite Pass</h4>
        <p>Access to Star Nite (Day 3)</p>
      </div>
      <div id="participantsContainerPlaceholder"></div>
    `;
  }

  calculateTotal();
}

/******************************
 * DAY PASS EVENT RENDER
 ******************************/
function renderDayEvents(dayKey) {
  const container = document.getElementById("dayEventsContainer");
  const evs = EVENTS[dayKey];

  container.innerHTML = `
    <div class="participant-card center-box">
      <h4>${dayKey.toUpperCase()} Events</h4>
      ${evs.map(ev => renderEventRow(ev, { dayKey })).join("")}
      ${dayKey === "day3" ? `
        <div class="toggle-card starnite-toggle" id="day3StarToggle">
          <div class="toggle-label">Include Star Nite</div>
          <div class="toggle-checkmark">✔</div>
        </div>` : ""}
    </div>
  `;

  activateToggleCards();

  const tg = document.getElementById("day3StarToggle");
  if (tg) tg.addEventListener("click", () => {
    tg.classList.toggle("active");
    includeStarNite = tg.classList.contains("active");
    calculateTotal();
  });
}

/******************************
 * VISITOR PASS EVENTS
 ******************************/
function renderVisitorEvents(days) {
  const container = document.getElementById("visitorEventsContainer");

  if (!days.length) return container.innerHTML = "";

  container.innerHTML = days.map(d => `
    <div class="participant-card center-box">
      <h4>${d.toUpperCase()} Events</h4>
      ${(EVENTS[d] || []).map(ev => renderEventRow(ev, { dayKey: d })).join("")}
    </div>
  `).join("");

  activateToggleCards();
}

/******************************
 * STARNITE TOGGLE FOR VISITORS
 ******************************/
function renderVisitorStarToggleIfNeeded() {
  const box = document.getElementById("visitorStarContainer");

  if (!currentVisitorDays.includes("day3")) {
    includeStarNite = false;
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="toggle-card starnite-toggle" id="visitorStarToggle">
      <div class="toggle-label">Include Star Nite (Day 3)</div>
      <div class="toggle-checkmark">✔</div>
    </div>
  `;

  const tg = document.getElementById("visitorStarToggle");

  tg.addEventListener("click", () => {
    tg.classList.toggle("active");
    includeStarNite = tg.classList.contains("active");
    calculateTotal();
  });
}

/******************************
 * FEST PASS EVENTS
 ******************************/
function renderFestEvents() {
  const container = document.getElementById("festEventsContainer");

  container.innerHTML = ["day0","day1","day2","day3"].map(d => `
    <div class="participant-card center-box">
      <h4>${d.toUpperCase()}</h4>
      ${(EVENTS[d] || []).map(ev => renderEventRow(ev, { dayKey: d })).join("")}
      ${d === "day3" ? `
        <div class="toggle-card starnite-toggle" id="festStarToggle">
          <div class="toggle-label">Include Star Nite</div>
          <div class="toggle-checkmark">✔</div>
        </div>` : ""}
    </div>
  `).join("");

  activateToggleCards();

  const tg = document.getElementById("festStarToggle");
  if (tg) tg.addEventListener("click", () => {
    tg.classList.toggle("active");
    includeStarNite = tg.classList.contains("active");
    calculateTotal();
  });
}

/******************************
 * ENABLE STAR-NITE TOGGLES
 ******************************/
function activateToggleCards() {
  document.querySelectorAll(".event-toggle").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("active");
    });
  });
}

/******************************
 * PARTICIPANT FORM RENDER
 ******************************/
function buildParticipantForms(count) {
  const box = document.getElementById("participantsContainerPlaceholder");
  participantsCount = count;
  box.innerHTML = "";

  if (count <= 0) return calculateTotal();

  const cache = getCachedProfile();

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "participant-card center-box";

    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input class="pname" placeholder="Full name" value="${i === 1 ? cache.name || "" : ""}">
      <input class="pemail" placeholder="Email" value="${i === 1 ? cache.email || "" : ""}">
      <input class="pphone" placeholder="Phone" value="${i === 1 ? cache.phone || "" : ""}">
      <input class="pcollege" placeholder="College" value="${i === 1 ? cache.college || "" : ""}">
    `;

    box.appendChild(div);
  }

  calculateTotal();
}

/******************************
 * PARTICIPANT COUNTER
 ******************************/
incBtn.onclick = () => {
  let v = Number(numInput.value) || 0;
  if (v < 10) numInput.value = ++v;
  buildParticipantForms(v);
};

decBtn.onclick = () => {
  let v = Number(numInput.value) || 0;
  if (v > 0) numInput.value = --v;
  buildParticipantForms(v);
};

/******************************
 * TOTAL PRICE CALCULATION
 ******************************/
function calculateTotal() {
  let t = 0;

  if (currentPassType === "Day Pass") {
    if (!currentDay) return updateTotal(0);
    t = currentDay !== "day3"
      ? PRICES.dayPass[currentDay]
      : includeStarNite ? PRICES.dayPass.day3_star : PRICES.dayPass.day3_normal;
  }

  if (currentPassType === "Visitor Pass") {
    currentVisitorDays.forEach(d => {
      t += d !== "day3"
        ? PRICES.visitor[d]
        : includeStarNite ? PRICES.visitor.day3_star : PRICES.visitor.day3_normal;
    });
  }

  if (currentPassType === "Fest Pass") {
    t = includeStarNite ? PRICES.fest.star : PRICES.fest.normal;
  }

  if (currentPassType === "Starnite Pass") {
    t = PRICES.starnite;
  }

  updateTotal(t);
}

function updateTotal(t) {
  currentTotal = t;
  totalAmountEl.textContent = `Total: ₹${t}`;
  payBtn.style.display = (t > 0 && participantsCount > 0) ? "inline-block" : "none";
}

/******************************
 * COLLECT SELECTED EVENTS
 ******************************/
function collectSelectedEvents() {
  const out = { day0: [], day1: [], day2: [], day3: [] };

  document.querySelectorAll(".event-toggle.active").forEach(c => {
    const d = c.dataset.day;
    const v = c.dataset.value;
    out[d].push(v);
  });

  return out;
}

/******************************
 * PAYMENT HANDLER
 ******************************/
payBtn.addEventListener("click", async e => {
  e.preventDefault();
  if (paying) return;
  paying = true;

  const names = [...document.querySelectorAll(".pname")].map(x => x.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map(x => x.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map(x => x.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(x => x.value.trim());

  if (names.length === 0) { alert("Add at least one participant"); paying = false; return; }

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) {
      alert("Fill all fields");
      paying = false;
      return;
    }
    if (!emailRe.test(emails[i])) { alert("Invalid email"); paying = false; return; }
    if (!phoneRe.test(phones[i])) { alert("Invalid phone"); paying = false; return; }
  }

  const participants = names.map((n,i) => ({
    name: n,
    email: emails[i],
    phone: phones[i],
    college: colleges[i]
  }));

  const payload = {
    registeredEmail: emails[0],
    passType: currentPassType,
    totalAmount: currentTotal,
    participants,
    selectedDay: currentDay,
    visitorDays: currentVisitorDays,
    includeStarNite,
    selectedEvents: collectSelectedEvents()
  };

  const rzp = new Razorpay({
    key: "rzp_test_Re1mOkmIGroT2c",
    amount: currentTotal * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${currentPassType} — Registration`,
    handler: async response => {
      payload.paymentId = response.razorpay_payment_id;
      navigator.sendBeacon(scriptURL, new Blob([JSON.stringify(payload)], { type: "application/json" }));
      window.location.href = "payment_success.html";
    }
  });

  try { rzp.open(); }
  catch { alert("Payment failed"); }

  paying = false;
});

setTimeout(() => {
  cachedProfile = getCachedProfile();
  calculateTotal();
}, 120);

window.PRAVAAH_passModule = { EVENTS, PRICES };

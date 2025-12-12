const scriptURL = "https://script.google.com/macros/s/AKfycby4F5rBxS_-KLmP05Yqm-R7PmjIx9_7dMsa28D1xds3X2jWSMKini-AJ-1wgGR6EmvDlg/exec";

const EVENTS = {
  day0: [],
  day1: ["Event 1", "Event 2", "Event 3"],
  day2: ["Event 1", "Event 2", "Event 3"],
  day3: ["Event 1", "Event 2", "Event 3"]
};

const PRICES = {
  dayPass: { day0: 300, day1: 800, day2: 800, day3_normal: 800, day3_star: 1100 },
  visitor: { day0: 400, day1: 500, day2: 500, day3_normal: 500, day3_star: 800 },
  fest: { normal: 2000, star: 2500 },
  starnite: 300
};

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/* FIREBASE INIT */
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

/* DOM ELEMENTS */
const passCards = document.querySelectorAll(".pass-card");
const selectionArea = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const participantForm = document.getElementById("participantForm");
const numInput = document.getElementById("numParticipants");
const decBtn = document.getElementById("decPart");
const incBtn = document.getElementById("incPart");
const totalAmountEl = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");

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

/* CACHE */
function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem("profileData") || "{}"); }
  catch { return {}; }
}
function saveProfileCache(obj) {
  try { localStorage.setItem("profileData", JSON.stringify(obj || {})); }
  catch {}
}

/* Get profile from Google Sheets */
async function refreshProfileFromSheets(email) {
  if (!email) return;
  try {
    const r = await fetch(`${scriptURL}?email=${encodeURIComponent(email)}&type=profile`);
    const d = await r.json();
    if (d && d.email) {
      saveProfileCache({
        name: d.name || "",
        email: d.email || email,
        phone: d.phone || "",
        college: d.college || ""
      });
      cachedProfile = getCachedProfile();
    }
  } catch {}
}

if (auth && auth.onAuthStateChanged) {
  auth.onAuthStateChanged(u => {
    cachedProfile = getCachedProfile();
    if ((!cachedProfile || !cachedProfile.email) && u?.email) {
      saveProfileCache({ email: u.email });
      cachedProfile = getCachedProfile();
    }
    if (u?.email) refreshProfileFromSheets(u.email);
  });
}

/* ESCAPE HTML */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* FIXED EVENT ROW (NO ERRORS) */
function renderEventRow(name, opt = {}) {
  const day = opt.dayKey || "";
  const selectable = !!opt.selectable;
  const safe = name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9\-]/g, "");
  const id = `${opt.idPrefix || "ev"}_${safe}`;

  return `
    <div class="event-row" data-day="${day}">
      <div class="event-left">
        ${selectable ? `<input type="checkbox" id="${id}" class="event-checkbox" data-day="${day}" value="${escapeHtml(name)}">` : ""}
        <label for="${id}" class="event-label">${escapeHtml(name)}</label>
      </div>
      <a href="${RULEBOOK_URL}" target="_blank"><i class="fa-regular fa-file-pdf pdf-icon"></i></a>
    </div>
  `;
}

/* PASS CARD SELECTION */
passCards.forEach(c => {
  c.addEventListener("click", () => {
    passCards.forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");

    let t = c.dataset.type || c.textContent.trim();
    if (/day/i.test(t)) t = "Day Pass";
    else if (/visitor/i.test(t)) t = "Visitor Pass";
    else if (/fest/i.test(t)) t = "Fest Pass";
    else if (/star/i.test(t)) t = "Starnite Pass";

    currentPassType = t;
    currentDay = null;
    currentVisitorDays = [];
    includeStarNite = false;
    participantsCount = 0;
    if (numInput) numInput.value = 0;

    renderSelectionArea();
  });
});

/* MAIN RENDER FUNCTION */
function renderSelectionArea() {
  if (!selectionArea) return;

  selectionArea.classList.remove("hidden");
  selectedPassTxt.textContent = `Selected: ${currentPassType}`;
  participantForm.innerHTML = "";

  /* ---------------- DAY PASS ---------------- */
  if (currentPassType === "Day Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4>Choose Day</h4>
        <div class="day-selector-row">
          <button class="day-card" data-day="day0" type="button">DAY 0</button>
          <button class="day-card" data-day="day1" type="button">DAY 1</button>
          <button class="day-card" data-day="day2" type="button">DAY 2</button>
          <button class="day-card" data-day="day3" type="button">DAY 3</button>
        </div>
      </div>

      <div id="dayEventsContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    document.querySelectorAll(".day-card").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault(); // 🔥 FIX ADDED

        document.querySelectorAll(".day-card").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");

        currentDay = btn.dataset.day;
        includeStarNite = false;

        renderDayEvents(currentDay);
        calculateTotal();
      });
    });
  }

  /* ---------------- VISITOR PASS ---------------- */
  if (currentPassType === "Visitor Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4>Choose Days</h4>
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
      btn.addEventListener("click", e => {
        e.preventDefault();

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

  /* ---------------- FEST PASS ---------------- */
  if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box"><h4>Fest Pass — All Days</h4></div>
      <div id="festEventsContainer"></div>
      <div id="festStarContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    renderFestEvents();
  }

  /* ---------------- STARNITE PASS ---------------- */
  if (currentPassType === "Starnite Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4>Starnite Pass</h4>
        <p>Standalone access to Star Nite (Day 3)</p>
      </div>
      <div id="participantsContainerPlaceholder"></div>
    `;
  }

  calculateTotal();
}

/* RENDER DAY PASS EVENTS */
function renderDayEvents(dayKey) {
  const container = document.getElementById("dayEventsContainer");
  if (!container) return;

  const evs = EVENTS[dayKey] || [];

  container.innerHTML = `
    <div class="participant-card center-box">
      <h4>${dayKey.toUpperCase()} Events</h4>

      <div class="events-list">
        ${evs.map(ev => renderEventRow(ev, { dayKey, selectable: true })).join("")}
      </div>

      ${dayKey === "day3" ? `
      <div class="starnite-toggle-row">
        <label><input type="checkbox" id="day3StarToggle"><span>Include Star Nite</span></label>
      </div>` : ""}
    </div>
  `;

  const tg = document.getElementById("day3StarToggle");
  if (tg) tg.addEventListener("change", () => {
    includeStarNite = tg.checked;
    calculateTotal();
  });
}

/* VISITOR EVENTS */
function renderVisitorEvents(days) {
  const container = document.getElementById("visitorEventsContainer");
  if (!container) return;

  if (!days.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = days.map(d => `
    <div class="participant-card center-box">
      <h4>${d.toUpperCase()} Events</h4>

      <div class="events-list">
        ${(EVENTS[d] || []).map(ev =>
          renderEventRow(ev, { dayKey: d, selectable: false })
        ).join("")}
      </div>
    </div>
  `).join("");
}

/* STAR NITE TOGGLE FOR VISITOR */
function renderVisitorStarToggleIfNeeded() {
  const container = document.getElementById("visitorStarContainer");
  if (!container) return;

  if (currentVisitorDays.includes("day3")) {
    container.innerHTML = `
      <div class="starnite-toggle-row">
        <label><input type="checkbox" id="visitorStar"><span>Include Star Nite (Day 3)</span></label>
      </div>
    `;

    document.getElementById("visitorStar").addEventListener("change", e => {
      includeStarNite = e.target.checked;
      calculateTotal();
    });

  } else {
    container.innerHTML = "";
    includeStarNite = false;
  }
}

/* FEST EVENTS */
function renderFestEvents() {
  const container = document.getElementById("festEventsContainer");

  container.innerHTML = ["day0", "day1", "day2", "day3"].map(d => `
    <div class="participant-card center-box">
      <h4>${d.toUpperCase()}</h4>

      <div class="events-list">
        ${(EVENTS[d] || []).map(ev =>
          renderEventRow(ev, { dayKey: d, selectable: true })
        ).join("")}
      </div>

      ${d === "day3" ? `
      <div class="starnite-toggle-row">
        <label><input type="checkbox" id="festStar"><span>Include Star Nite</span></label>
      </div>` : ""}
    </div>
  `).join("");

  const tg = document.getElementById("festStar");
  if (tg) tg.addEventListener("change", () => {
    includeStarNite = tg.checked;
    calculateTotal();
  });
}

/* PARTICIPANT FORMS */
function buildParticipantForms(count) {
  const placeholder = document.getElementById("participantsContainerPlaceholder");
  participantsCount = count;
  placeholder.innerHTML = "";

  if (count <= 0) {
    calculateTotal();
    return;
  }

  const cache = getCachedProfile();

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "participant-card center-box";

    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input class="pname" placeholder="Full name" value="${i === 1 ? escapeHtml(cache.name || "") : ""}">
      <input class="pemail" placeholder="Email" value="${i === 1 ? escapeHtml(cache.email || "") : ""}">
      <input class="pphone" placeholder="Phone" value="${i === 1 ? escapeHtml(cache.phone || "") : ""}">
      <input class="pcollege" placeholder="College" value="${i === 1 ? escapeHtml(cache.college || "") : ""}">
    `;

    placeholder.appendChild(div);
  }

  calculateTotal();
}

/* COUNTER */
if (incBtn) {
  incBtn.addEventListener("click", () => {
    let v = parseInt(numInput.value) || 0;
    if (v < 10) numInput.value = ++v;
    buildParticipantForms(v);
  });
}
if (decBtn) {
  decBtn.addEventListener("click", () => {
    let v = parseInt(numInput.value) || 0;
    if (v > 0) numInput.value = --v;
    buildParticipantForms(v);
  });
}
if (numInput) {
  numInput.addEventListener("input", () => {
    let v = parseInt(numInput.value) || 0;
    if (v < 0) v = 0;
    if (v > 10) v = 10;
    numInput.value = v;
    buildParticipantForms(v);
  });
}

/* CALCULATE TOTAL */
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

/* COLLECT EVENTS */
function collectSelectedEvents() {
  const out = { day0: [], day1: [], day2: [], day3: [] };

  document.querySelectorAll(".event-checkbox:checked").forEach(c => {
    out[c.dataset.day].push(c.value);
  });

  return out;
}

/* PAYMENT */
if (payBtn) {
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
        alert("Please fill all participant fields");
        paying = false;
        return;
      }
      if (!emailRe.test(emails[i])) { alert("Invalid email"); paying = false; return; }
      if (!phoneRe.test(phones[i])) { alert("Invalid phone"); paying = false; return; }
    }

    const participants = names.map((n, i) => ({
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
    catch (err) {
      alert("Payment failed to start");
      paying = false;
    }
  });
}

/* INIT */
setTimeout(() => {
  cachedProfile = getCachedProfile();
  calculateTotal();
}, 120);

window.PRAVAAH_passModule = { EVENTS, PRICES };

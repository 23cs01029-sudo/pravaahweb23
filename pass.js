/*******************************
 *  PRAVAAH 2026 — FINAL SCRIPT.JS
 *  (Complete working version)
 *******************************/

const scriptURL =
  "https://script.google.com/macros/s/AKfycby4F5rBxS_-KLmP05Yqm-R7PmjIx9_7dMsa28D1xds3X2jWSMKini-AJ-1wgGR6EmvDlg/exec";

/* =======================================
      EVENTS & PRICES
======================================= */
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

/* =======================================
      FIREBASE INIT
======================================= */
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

/* =======================================
      DOM ELEMENTS
======================================= */
const passCards = document.querySelectorAll(".pass-card");
const selectionArea = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const participantForm = document.getElementById("participantForm");

const numInput = document.getElementById("numParticipants");
const decBtn = document.getElementById("decPart");
const incBtn = document.getElementById("incPart");

const totalAmountEl = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");
if (payBtn) payBtn.setAttribute("type", "button");

let currentPassType = null;
let currentDay = null;
let currentVisitorDays = [];
let includeStarNite = false;
let participantsCount = 0;

let cachedProfile = {};
let currentTotal = 0;
let paying = false;

const RULEBOOK_URL = "rulebooks/sample.pdf";

/* =======================================
      LOCAL CACHE FOR FAILED FORM
======================================= */
function saveFailedCache() {
  const data = {
    participants: [...document.querySelectorAll(".participant-card")].map((card) => ({
      name: card.querySelector(".pname")?.value || "",
      email: card.querySelector(".pemail")?.value || "",
      phone: card.querySelector(".pphone")?.value || "",
      college: card.querySelector(".pcollege")?.value || ""
    })),
    participantsCount,
    currentPassType,
    currentDay,
    currentVisitorDays,
    includeStarNite
  };

  localStorage.setItem("failedForm", JSON.stringify(data));
}

function loadFailedCache() {
  try {
    return JSON.parse(localStorage.getItem("failedForm") || "{}");
  } catch {
    return {};
  }
}

function clearFailedCache() {
  localStorage.removeItem("failedForm");
}

/* =======================================
      PROFILE CACHE (Sheets + Firebase)
======================================= */
function getCachedProfile() {
  try {
    return JSON.parse(localStorage.getItem("profileData") || "{}");
  } catch {
    return {};
  }
}

function saveProfileCache(obj) {
  localStorage.setItem("profileData", JSON.stringify(obj));
}

async function refreshProfileFromSheets(email) {
  if (!email) return;

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
}

if (auth && auth.onAuthStateChanged) {
  auth.onAuthStateChanged((u) => {
    if (u?.email) refreshProfileFromSheets(u.email);
  });
}

/* =======================================
      EVENT ROW TEMPLATE
======================================= */
function renderEventRow(name, opt = {}) {
  const id = "ev_" + name.replace(/\s+/g, "");

  return `
    <div class="event-row">
      <div class="event-left">
        ${opt.selectable ? `<input type="checkbox" id="${id}" class="event-checkbox" data-day="${opt.dayKey}" value="${name}">` : ""}
        <label for="${id}" class="event-label">${name}</label>
      </div>
      <a href="${RULEBOOK_URL}" target="_blank">
        <i class="fa-regular fa-file-pdf pdf-icon"></i>
      </a>
    </div>
  `;
}

/* =======================================
      PASS CARD CLICK HANDLER
======================================= */
passCards.forEach((c) => {
  c.addEventListener("click", () => {
    passCards.forEach((x) => x.classList.remove("selected"));
    c.classList.add("selected");

    let t = c.dataset.type;
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

/* =======================================
      STAR NITE TOGGLE TEMPLATE
======================================= */
function starNiteToggleHTML(id) {
  return `
    <div class="starnite-toggle-row">
        <label>
            <input type="checkbox" id="${id}">
            <span>Include Star Nite</span>
        </label>
    </div>
  `;
}

/* =======================================
      RENDER SELECTION AREA
======================================= */
function renderSelectionArea() {
  selectionArea.classList.remove("hidden");
  selectedPassTxt.textContent = `Selected: ${currentPassType}`;
  participantForm.innerHTML = "";

  /* ---------- DAY PASS ---------- */
  if (currentPassType === "Day Pass") {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Choose Day</h4>
        <div class="day-selector-row">

          <button type="button" class="day-card" data-day="day0">DAY 0</button>
          <button type="button" class="day-card" data-day="day1">DAY 1</button>
          <button type="button" class="day-card" data-day="day2">DAY 2</button>
          <button type="button" class="day-card" data-day="day3">DAY 3</button>

        </div>
      </div>

      <div id="dayEventsContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    document.querySelectorAll(".day-card").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.querySelectorAll(".day-card").forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");

        currentDay = btn.dataset.day;
        includeStarNite = false;

        renderDayEvents(currentDay);
        calculateTotal();
      })
    );
  }

  /* ---------- VISITOR PASS ---------- */
  if (currentPassType === "Visitor Pass") {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Select Days</h4>
        <div class="visitor-days-col">
          <button type="button" class="visitor-day-card" data-day="day0">DAY 0</button>
          <button type="button" class="visitor-day-card" data-day="day1">DAY 1</button>
          <button type="button" class="visitor-day-card" data-day="day2">DAY 2</button>
          <button type="button" class="visitor-day-card" data-day="day3">DAY 3</button>
        </div>
      </div>

      <div id="visitorEventsContainer"></div>
      <div id="visitorStarContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    document.querySelectorAll(".visitor-day-card").forEach((btn) =>
      btn.addEventListener("click", () => {
        let d = btn.dataset.day;

        if (currentVisitorDays.includes(d)) {
          currentVisitorDays = currentVisitorDays.filter((x) => x !== d);
          btn.classList.remove("active");
        } else {
          currentVisitorDays.push(d);
          btn.classList.add("active");
        }

        renderVisitorEvents(currentVisitorDays);
        renderVisitorStarToggleIfNeeded();
        calculateTotal();
      })
    );
  }

  /* ---------- FEST PASS ---------- */
  if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = `
      <div class="participant-card"><h4>Fest Pass (All Days)</h4></div>
      <div id="festEventsContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;

    renderFestEvents();
  }

  /* ---------- STARNITE PASS ---------- */
  if (currentPassType === "Starnite Pass") {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Starnite Pass</h4>
        <p>Standalone entry</p>
      </div>
      <div id="participantsContainerPlaceholder"></div>
    `;
  }

  calculateTotal();
}

/* =======================================
      RENDER DAY PASS EVENTS
======================================= */
function renderDayEvents(day) {
  const evs = EVENTS[day] || [];

  document.getElementById("dayEventsContainer").innerHTML = `
    <div class="participant-card">
      <h4>${day.toUpperCase()}</h4>
      <div>${evs.map((e) => renderEventRow(e, { dayKey: day, selectable: true })).join("")}</div>
      ${day === "day3" ? starNiteToggleHTML("day3StarToggle") : ""}
    </div>
  `;

  const toggle = document.getElementById("day3StarToggle");
  if (toggle)
    toggle.addEventListener("change", () => {
      includeStarNite = toggle.checked;
      calculateTotal();
    });
}

/* =======================================
      VISITOR PASS EVENTS
======================================= */
function renderVisitorEvents(days) {
  const c = document.getElementById("visitorEventsContainer");

  if (!days.length) {
    c.innerHTML = "";
    return;
  }

  c.innerHTML = days
    .map(
      (d) => `
    <div class="participant-card">
      <h4>${d.toUpperCase()}</h4>
      <div>${EVENTS[d].map((ev) => renderEventRow(ev, { dayKey: d, selectable: false })).join("")}</div>
    </div>
  `
    )
    .join("");
}

/* --- Visitor Star toggle --- */
function renderVisitorStarToggleIfNeeded() {
  const c = document.getElementById("visitorStarContainer");

  if (currentVisitorDays.includes("day3")) {
    c.innerHTML = starNiteToggleHTML("visitorStar");

    document.getElementById("visitorStar").addEventListener("change", (e) => {
      includeStarNite = e.target.checked;
      calculateTotal();
    });
  } else {
    c.innerHTML = "";
    includeStarNite = false;
  }
}

/* =======================================
      FEST EVENTS
======================================= */
function renderFestEvents() {
  const c = document.getElementById("festEventsContainer");

  c.innerHTML = ["day0", "day1", "day2", "day3"]
    .map(
      (d) => `
      <div class="participant-card">
        <h4>${d.toUpperCase()}</h4>
        <div>${EVENTS[d].map((ev) => renderEventRow(ev, { dayKey: d, selectable: true })).join("")}</div>
        ${d === "day3" ? starNiteToggleHTML("festStar") : ""}
      </div>
  `
    )
    .join("");

  const toggle = document.getElementById("festStar");
  if (toggle)
    toggle.addEventListener("change", () => {
      includeStarNite = toggle.checked;
      calculateTotal();
    });
}

/* =======================================
      PARTICIPANT FORM GENERATION
======================================= */
function buildParticipantForms(count) {
  const c = document.getElementById("participantsContainerPlaceholder");

  participantsCount = count;
  c.innerHTML = "";

  if (count <= 0) {
    calculateTotal();
    return;
  }

  const profile = getCachedProfile();
  const failed = loadFailedCache();

  for (let i = 1; i <= count; i++) {
    let fail = failed.participants?.[i - 1] || {};

    let autoFill =
      i === 1 &&
      profile.name &&
      profile.email &&
      fail.name === undefined &&
      profile.name.trim().toLowerCase() === profile.name.trim().toLowerCase();

    const div = document.createElement("div");
    div.className = "participant-card";

    div.innerHTML = `
      <h4>Participant ${i}</h4>

      <input class="pname" placeholder="Full name" value="${autoFill ? profile.name : fail.name || ""}">
      <input class="pemail" placeholder="Email" value="${autoFill ? profile.email : fail.email || ""}">
      <input class="pphone" placeholder="Phone" value="${autoFill ? profile.phone : fail.phone || ""}">
      <input class="pcollege" placeholder="College" value="${autoFill ? profile.college : fail.college || ""}">
    `;

    div.querySelector(".pname").addEventListener("input", (e) => {
      if (
        profile.name &&
        e.target.value.trim().toLowerCase() !== profile.name.trim().toLowerCase()
      ) {
        div.querySelector(".pemail").value = "";
        div.querySelector(".pphone").value = "";
        div.querySelector(".pcollege").value = "";
      }
    });

    c.appendChild(div);
  }

  calculateTotal();
}

/* =======================================
      PARTICIPANT COUNTER
======================================= */
incBtn.addEventListener("click", () => {
  let v = +numInput.value || 0;
  if (v < 10) numInput.value = ++v;
  buildParticipantForms(v);
});

decBtn.addEventListener("click", () => {
  let v = +numInput.value || 0;
  if (v > 0) numInput.value = --v;
  buildParticipantForms(v);
});

numInput.addEventListener("input", () => {
  let v = +numInput.value || 0;
  if (v < 0) v = 0;
  if (v > 10) v = 10;
  numInput.value = v;
  buildParticipantForms(v);
});

/* =======================================
      PRICE CALCULATION
      Total = base × participants 
======================================= */
function calculateTotal() {
  let base = 0;

  if (currentPassType === "Day Pass") {
    if (!currentDay) return updateTotal(0);

    base =
      currentDay !== "day3"
        ? PRICES.dayPass[currentDay]
        : includeStarNite
        ? PRICES.dayPass.day3_star
        : PRICES.dayPass.day3_normal;
  }

  if (currentPassType === "Visitor Pass") {
    currentVisitorDays.forEach((d) => {
      base +=
        d !== "day3"
          ? PRICES.visitor[d]
          : includeStarNite
          ? PRICES.visitor.day3_star
          : PRICES.visitor.day3_normal;
    });
  }

  if (currentPassType === "Fest Pass") {
    base = includeStarNite ? PRICES.fest.star : PRICES.fest.normal;
  }

  if (currentPassType === "Starnite Pass") {
    base = PRICES.starnite;
  }

  updateTotal(base * participantsCount);
}

function updateTotal(amount) {
  currentTotal = amount;
  totalAmountEl.textContent = `Total: ₹${amount}`;
  payBtn.style.display = amount > 0 ? "inline-block" : "none";
}

/* =======================================
      EVENT COLLECTION
======================================= */
function collectSelectedEvents() {
  const out = { day0: [], day1: [], day2: [], day3: [] };

  document.querySelectorAll(".event-checkbox:checked").forEach((c) => {
    out[c.dataset.day].push(c.value);
  });

  return out;
}

/* =======================================
      PAYMENT HANDLER
======================================= */
payBtn.addEventListener("click", async () => {
  if (paying) return;
  paying = true;

  const cards = [...document.querySelectorAll(".participant-card")];

  const participants = cards.map((c) => ({
    name: c.querySelector(".pname").value.trim(),
    email: c.querySelector(".pemail").value.trim(),
    phone: c.querySelector(".pphone").value.trim(),
    college: c.querySelector(".pcollege").value.trim()
  }));

  for (let p of participants) {
    if (!p.name || !p.email || !p.phone || !p.college) {
      alert("Fill all participant fields.");
      paying = false;
      return;
    }
  }

  const payload = {
    registeredEmail: participants[0].email,
    passType: currentPassType,
    totalAmount: currentTotal,
    participants,
    daySelected: currentDay,
    visitorDays: currentVisitorDays,
    starnite: includeStarNite,
    events: collectSelectedEvents(),
  };

  saveFailedCache();

  const rzp = new Razorpay({
    key: "rzp_test_Re1mOkmIGroT2c",
    amount: currentTotal * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    handler: async (res) => {
      payload.paymentId = res.razorpay_payment_id;

      clearFailedCache();

      await fetch(scriptURL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      window.location.href = "payment_success.html";
    }
  });

  try {
    rzp.open();
  } catch {
    alert("Payment failed to start.");
    paying = false;
  }
});

/* =======================================
      INITIAL LOAD
======================================= */
setTimeout(() => {
  cachedProfile = getCachedProfile();
  const f = loadFailedCache();

  if (f.participantsCount) {
    currentPassType = f.currentPassType;
    currentDay = f.currentDay;
    currentVisitorDays = f.currentVisitorDays || [];
    includeStarNite = f.includeStarNite || false;

    renderSelectionArea();
    numInput.value = f.participantsCount;
    buildParticipantForms(f.participantsCount);
  }
}, 150);


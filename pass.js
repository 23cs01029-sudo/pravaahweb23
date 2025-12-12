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

function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem("profileData") || "{}"); } catch { return {}; }
}
function saveProfileCache(obj) {
  try { localStorage.setItem("profileData", JSON.stringify(obj || {})); } catch {}
}
async function refreshProfileFromSheets(email) {
  if (!email) return;
  try {
    const r = await fetch(`${scriptURL}?email=${encodeURIComponent(email)}&type=profile`);
    const d = await r.json();
    if (d && d.email) {
      saveProfileCache({ name: d.name || "", email: d.email || email, phone: d.phone || "", college: d.college || "" });
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

function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function renderEventRow(name, opt = {}) {
  const day = opt.dayKey || "";
  const selectable = !!opt.selectable;
  const safe = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const id = `${opt.idPrefix || "ev"}_${safe}`;
  if (selectable) {
    return `
    <div class="event-row" data-day="${day}">
      <div class="event-left">
        <input type="checkbox" id="${id}" class="event-checkbox" data-day="${day}" value="${escapeHtml(name)}">
        <label for="${id}" class="event-label">${escapeHtml(name)}</label>
      </div>
      <a href="${RULEBOOK_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-regular fa-file-pdf pdf-icon"></i></a>
    </div>`;
  }
  return `
  <div class="event-row" data-day="${day}">
    <div class="event-left"><span class="event-label">${escapeHtml(name)}</span></div>
    <a href="${RULEBOOK_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-regular fa-file-pdf pdf-icon"></i></a>
  </div>`;
}

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

function renderSelectionArea() {
  if (!selectionArea) return;
  selectionArea.classList.remove("hidden");
  selectedPassTxt && (selectedPassTxt.textContent = `Selected: ${currentPassType || "—"}`);
  if (participantForm) participantForm.innerHTML = "";

  if (currentPassType === "Day Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
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

  if (currentPassType === "Visitor Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box">
        <h4>Choose Days to Visit</h4>
        <div id="visitorDaysColumn" class="visitor-days-col">
          <label class="visitor-day-card"><input type="checkbox" class="visitorDayCheckbox" value="day0"><span>DAY 0</span></label>
          <label class="visitor-day-card"><input type="checkbox" class="visitorDayCheckbox" value="day1"><span>DAY 1</span></label>
          <label class="visitor-day-card"><input type="checkbox" class="visitorDayCheckbox" value="day2"><span>DAY 2</span></label>
          <label class="visitor-day-card"><input type="checkbox" class="visitorDayCheckbox" value="day3"><span>DAY 3</span></label>
        </div>
      </div>
      <div id="visitorEventsContainer"></div>
      <div id="visitorStarContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;
    document.querySelectorAll(".visitorDayCheckbox").forEach(cb => cb.addEventListener("change", () => {
      currentVisitorDays = [...document.querySelectorAll(".visitorDayCheckbox:checked")].map(x => x.value);
      includeStarNite = false;
      renderVisitorEvents(currentVisitorDays);
      renderVisitorStarToggleIfNeeded();
      calculateTotal();
    }));
  }

  if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = `
      <div class="participant-card center-box"><h4>Fest Pass — All Days</h4></div>
      <div id="festEventsContainer"></div>
      <div id="festStarContainer"></div>
      <div id="participantsContainerPlaceholder"></div>
    `;
    renderFestEvents();
  }

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

function renderDayEvents(dayKey) {
  const container = document.getElementById("dayEventsContainer");
  if (!container) return;
  if (!dayKey) { container.innerHTML = ""; return; }
  const evs = EVENTS[dayKey] || [];
  container.innerHTML = `
    <div class="participant-card center-box">
      <h4>${dayKey.toUpperCase()} Events</h4>
      <div class="events-list">
        ${evs.map(ev => renderEventRow(ev, { dayKey, selectable: true, idPrefix: `day_${dayKey}` })).join("")}
      </div>
      ${dayKey === "day3" ? `<div class="starnite-toggle-row"><label><input type="checkbox" id="day3StarToggle"><span>Include Star Nite</span></label></div>` : ""}
    </div>
  `;
  const tg = document.getElementById("day3StarToggle");
  if (tg) tg.addEventListener("change", (e) => { includeStarNite = !!e.target.checked; calculateTotal(); });
}

function renderVisitorEvents(days) {
  const container = document.getElementById("visitorEventsContainer");
  if (!container) return;
  if (!days || !days.length) { container.innerHTML = ""; return; }
  container.innerHTML = days.map(d => {
    const evs = EVENTS[d] || [];
    return `
      <div class="participant-card center-box">
        <h4>${d.toUpperCase()} Events</h4>
        <div class="events-list">
          ${evs.map(ev => renderEventRow(ev, { dayKey: d, selectable: false })).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderVisitorStarToggleIfNeeded() {
  const container = document.getElementById("visitorStarContainer");
  if (!container) return;
  if (currentVisitorDays.includes("day3")) {
    container.innerHTML = `<div class="starnite-toggle-row"><label><input type="checkbox" id="visitor_day3_star"><span>Include Star Nite (Day 3)</span></label></div>`;
    const tg = document.getElementById("visitor_day3_star");
    if (tg) tg.addEventListener("change", (e) => { includeStarNite = !!e.target.checked; calculateTotal(); });
  } else {
    container.innerHTML = "";
    includeStarNite = false;
  }
}

function renderFestEvents() {
  const container = document.getElementById("festEventsContainer");
  if (!container) return;
  container.innerHTML = ["day0", "day1", "day2", "day3"].map(d => {
    const evs = EVENTS[d] || [];
    return `
      <div class="participant-card center-box">
        <h4>${d.toUpperCase()}</h4>
        <div class="events-list">
          ${evs.map(ev => renderEventRow(ev, { dayKey: d, selectable: true, idPrefix: `fest_${d}` })).join("")}
        </div>
        ${d === "day3" ? `<div class="starnite-toggle-row"><label><input type="checkbox" id="fest_day3_star"><span>Include Star Nite (Day 3)</span></label></div>` : ""}
      </div>
    `;
  }).join("");
  setTimeout(() => {
    const tg = document.getElementById("fest_day3_star");
    if (tg) tg.addEventListener("change", (e) => { includeStarNite = !!e.target.checked; calculateTotal(); });
  }, 50);
}

function buildParticipantForms(count) {
  const placeholder = document.getElementById("participantsContainerPlaceholder");
  if (!placeholder) return;
  participantsCount = count;
  placeholder.innerHTML = "";
  if (count <= 0) { calculateTotal(); return; }
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
    const nameInput = div.querySelector(".pname");
    const emailInput = div.querySelector(".pemail");
    const phoneInput = div.querySelector(".pphone");
    const collegeInput = div.querySelector(".pcollege");
    nameInput && nameInput.addEventListener("input", () => {
      const typed = (nameInput.value || "").trim().toLowerCase();
      if (cache.name && typed && typed === cache.name.trim().toLowerCase()) {
        if (cache.email) emailInput.value = cache.email;
        if (cache.phone) phoneInput.value = cache.phone;
        if (cache.college) collegeInput.value = cache.college;
        [emailInput, phoneInput, collegeInput].forEach(el => { el.style.boxShadow = "0 0 8px cyan"; setTimeout(() => (el.style.boxShadow = ""), 700); });
      }
    });
  }
  calculateTotal();
}

if (incBtn) {
  incBtn.addEventListener("click", () => {
    let v = parseInt(numInput.value) || 0;
    if (v < 10) { numInput.value = ++v; buildParticipantForms(v); }
  });
}
if (decBtn) {
  decBtn.addEventListener("click", () => {
    let v = parseInt(numInput.value) || 0;
    if (v > 0) { numInput.value = --v; buildParticipantForms(v); }
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

function calculateTotal() {
  let t = 0;
  if (!currentPassType) { updateTotal(0); return; }
  if (currentPassType === "Day Pass") {
    if (!currentDay) { updateTotal(0); return; }
    t = currentDay !== "day3" ? PRICES.dayPass[currentDay] || 0 : (includeStarNite ? PRICES.dayPass.day3_star : PRICES.dayPass.day3_normal);
  } else if (currentPassType === "Visitor Pass") {
    (currentVisitorDays || []).forEach(d => {
      t += d !== "day3" ? PRICES.visitor[d] || 0 : (includeStarNite ? PRICES.visitor.day3_star : PRICES.visitor.day3_normal);
    });
  } else if (currentPassType === "Fest Pass") {
    t = includeStarNite ? PRICES.fest.star : PRICES.fest.normal;
  } else if (currentPassType === "Starnite Pass") {
    t = PRICES.starnite;
  }
  updateTotal(t);
}

function updateTotal(t) {
  currentTotal = t;
  if (totalAmountEl) totalAmountEl.textContent = `Total: ₹${t}`;
  if (payBtn) payBtn.style.display = (t > 0 && participantsCount > 0) ? "inline-block" : "none";
}

function collectSelectedEvents() {
  const out = { day0: [], day1: [], day2: [], day3: [] };
  document.querySelectorAll(".event-checkbox:checked").forEach(c => {
    const d = c.dataset.day || "";
    if (!out[d]) out[d] = [];
    out[d].push(c.value);
  });
  return out;
}

if (payBtn) {
  payBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (paying) return;
    paying = true;
    const names = [...document.querySelectorAll(".pname")].map(x => x.value.trim());
    const emails = [...document.querySelectorAll(".pemail")].map(x => x.value.trim());
    const phones = [...document.querySelectorAll(".pphone")].map(x => x.value.trim());
    const colleges = [...document.querySelectorAll(".pcollege")].map(x => x.value.trim());
    if (names.length === 0) { alert("Add at least one participant"); paying = false; return; }
    for (let i = 0; i < names.length; i++) {
      if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) { alert("Please fill all participant fields"); paying = false; return; }
      if (!emailRe.test(emails[i])) { alert("Invalid email: " + emails[i]); paying = false; return; }
      if (!phoneRe.test(phones[i])) { alert("Invalid phone: " + phones[i]); paying = false; return; }
    }
    const participants = names.map((n, i) => ({ name: n, email: emails[i], phone: phones[i], college: colleges[i] }));
    const selectedEvents = collectSelectedEvents();
    const payloadMeta = {
      passType: currentPassType,
      totalAmount: currentTotal,
      participantsCount: participants.length,
      selectedDay: currentPassType === "Day Pass" ? currentDay : null,
      visitorDays: currentPassType === "Visitor Pass" ? currentVisitorDays : null,
      includeStarNite: !!includeStarNite,
      selectedEvents
    };
    const userEmail = auth?.currentUser?.email || (participants[0] && participants[0].email) || "";
    const options = {
      key: "rzp_test_Re1mOkmIGroT2c",
      amount: Number(currentTotal) * 100,
      currency: "INR",
      name: "PRAVAAH 2026",
      description: `${currentPassType} — Registration`,
      image: "pravah-logo.png",
      prefill: { name: participants[0].name || "", email: participants[0].email || userEmail, contact: participants[0].phone || "" },
      handler: async function (response) {
        const payload = {
          registeredEmail: userEmail,
          paymentId: response.razorpay_payment_id,
          passType: payloadMeta.passType,
          totalAmount: payloadMeta.totalAmount,
          participants: participants,
          selectedDay: payloadMeta.selectedDay,
          visitorDays: payloadMeta.visitorDays,
          includeStarNite: payloadMeta.includeStarNite,
          selectedEvents: payloadMeta.selectedEvents
        };
        let sent = false;
        try { if (navigator.sendBeacon) sent = navigator.sendBeacon(scriptURL, new Blob([JSON.stringify(payload)], { type: "application/json" })); } catch {}
        if (!sent) {
          try { await fetch(scriptURL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }); } catch {}
        }
        const match = participants.find(p => p.email === userEmail) || participants[0];
        if (match) saveProfileCache({ name: match.name || "", email: match.email || "", phone: match.phone || "", college: match.college || "" });
        const placeholder = document.getElementById("participantsContainerPlaceholder");
        if (placeholder) placeholder.innerHTML = "";
        if (numInput) numInput.value = 0;
        participantsCount = 0;
        paying = false;
        currentTotal = 0;
        if (totalAmountEl) totalAmountEl.textContent = "Total: ₹0";
        if (payBtn) payBtn.style.display = "none";
        passCards.forEach(c => c.classList.remove("selected"));
        if (selectionArea) selectionArea.classList.add("hidden");
        currentPassType = null;
        currentDay = null;
        currentVisitorDays = [];
        includeStarNite = false;
        window.location.href = "payment_success.html";
      },
      modal: { ondismiss: function () { paying = false; } }
    };
    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay launch error", err);
      paying = false;
      alert("Payment failed to start. Try again.");
    }
  });
}

setTimeout(() => {
  cachedProfile = getCachedProfile();
  calculateTotal();
}, 120);

window.PRAVAAH_passModule = { EVENTS, PRICES };

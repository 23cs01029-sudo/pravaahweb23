// ===========================================================
// PRAVAAH 2026 — PASS SYSTEM (DAY / VISITOR / FEST) + Razorpay
// Sends detailed payload to Apps Script (scriptURL)
// ===========================================================

/* ---------------- BACKEND URL ---------------- */
const scriptURL = "https://script.google.com/macros/s/AKfycby4F5rBxS_-KLmP05Yqm-R7PmjIx9_7dMsa28D1xds3X2jWSMKini-AJ-1wgGR6EmvDlg/exec";

/* ---------------- EVENTS (placeholders you asked) ---------------- */
const EVENTS = {
  day0: ["Event 1", "Event 2", "Event 3"],
  day1: ["Event 1", "Event 2", "Event 3"],
  day2: ["Event 1", "Event 2", "Event 3"],
  day3: ["Event 1", "Event 2", "Event 3", "Star Nite"]
};

/* ---------------- PASS PRICING RULES ----------------
 You described:
 - Day pass: day0=300, day1=800, day2=800, day3=800 or 1100 if StarNite
 - Visitor: day0=400, day1=500, day2=500, day3=500 or 800 with StarNite
 - Fest pass: 2000 (no StarNite) or 2500 if include StarNite
*/
const PRICES = {
  dayPass: { day0: 300, day1: 800, day2: 800, day3_normal: 800, day3_star: 1100 },
  visitor: { day0: 400, day1: 500, day2: 500, day3_normal: 500, day3_star: 800 },
  fest: { normal: 2000, star: 2500 }
};

/* ---------------- FIREBASE AUTH (reuse global if present) ---------------- */
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
    appId: "1:287687647267:web:7aecd603ee202779b89196",
  };
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  window.auth = auth;
}

/* ---------------- DOM elements (must exist in your HTML) ---------------- */
const passCards = document.querySelectorAll(".pass-card");
const selectionArea = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const participantForm = document.getElementById("participantForm");
const numInput = document.getElementById("numParticipants");
const increaseBtn = document.getElementById("increaseBtn");
const decreaseBtn = document.getElementById("decreaseBtn");
const totalAmountEl = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");
const timerDisplay = document.getElementById("payment-timer");

/* ---------------- state ---------------- */
let currentPassType = null;      // "Day Pass" | "Visitor Pass" | "Fest Pass"
let currentDay = null;           // 'day0'..'day3' for Day Pass
let currentVisitorDays = [];     // array of 'day0'..'day3' for Visitor Pass
let includeStarNite = false;     // whether Star Nite included (Day3)
let participantsCount = 0;
let cachedProfile = {};          // from localStorage or Sheets
let currentTotal = 0;
let paying = false;

/* ---------------- small helpers & regex ---------------- */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;

/* ---------------- profile cache functions ---------------- */
function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem("profileData") || "{}"); } catch { return {}; }
}
function saveProfileCache(obj) {
  try { localStorage.setItem("profileData", JSON.stringify(obj || {})); } catch {}
}

/* refresh profile from Apps Script (optional) */
async function refreshProfileFromSheets(email) {
  if (!email) return;
  try {
    const res = await fetch(`${scriptURL}?email=${encodeURIComponent(email)}&type=profile`);
    const data = await res.json();
    if (data && data.email) {
      saveProfileCache({
        name: data.name || "",
        email: data.email || email,
        phone: data.phone || "",
        college: data.college || ""
      });
      cachedProfile = getCachedProfile();
    }
  } catch (err) { console.warn("profile refresh failed", err); }
}

/* ---------------- initialize cached profile when auth ready ---------------- */
auth.onAuthStateChanged(user => {
  cachedProfile = getCachedProfile();
  if ((!cachedProfile || !cachedProfile.email) && user && user.email) {
    saveProfileCache({ email: user.email });
    cachedProfile = getCachedProfile();
  }
  if (user && user.email) refreshProfileFromSheets(user.email);
});

/* ---------------- UI: pass card selection ---------------- */
passCards.forEach(card => {
  card.addEventListener("click", () => {
    passCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    // Use dataset.name as pass type (you must label cards in HTML accordingly)
    currentPassType = card.dataset.name || card.textContent.trim();
    currentDay = null;
    currentVisitorDays = [];
    includeStarNite = false;
    participantsCount = 0;
    numInput.value = 0;
    renderSelectionArea();
  });
});

/* ---------------- Render selection area based on pass type ---------------- */
function renderSelectionArea() {
  if (!selectionArea) return;
  selectionArea.classList.remove("hidden");
  selectedPassTxt.textContent = `Selected: ${currentPassType || "—"}`;
  participantForm.innerHTML = "";

  // Add pass-specific UI
  if (currentPassType === "Day Pass") {
    participantForm.innerHTML = dayPassUI();
    document.getElementById("daySelect").addEventListener("change", onDaySelect);
  } else if (currentPassType === "Visitor Pass") {
    participantForm.innerHTML = visitorPassUI();
    document.querySelectorAll(".visitorDayCheckbox").forEach(cb => cb.addEventListener("change", onVisitorDayToggle));
  } else if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = festPassUI();
    document.getElementById("festStarNite")?.addEventListener("change", (e) => {
      includeStarNite = e.target.checked;
      calculateTotal();
    });
  } else {
    // default: allow participants form only (if you want)
    participantForm.innerHTML = `<div class="participant-card"><p>Select a pass to continue</p></div>`;
  }

  // ensure participant forms area for people selection is present (we will add forms when participantsCount changes)
  calculateTotal();
}

/* ---------------- UI templates ---------------- */
function dayPassUI() {
  return `
    <div class="participant-card">
      <h4>Choose Day</h4>
      <select id="daySelect" class="pselect">
        <option value="">-- Select Day --</option>
        <option value="day0">Day 0</option>
        <option value="day1">Day 1</option>
        <option value="day2">Day 2</option>
        <option value="day3">Day 3 (Star Nite)</option>
      </select>
    </div>
    <div id="dayEventsContainer"></div>
    <div class="participant-card" id="participantsContainerPlaceholder"></div>
  `;
}

function visitorPassUI() {
  return `
    <div class="participant-card">
      <h4>Choose Days to Visit</h4>
      <label><input type="checkbox" class="visitorDayCheckbox" value="day0"> Day 0</label><br>
      <label><input type="checkbox" class="visitorDayCheckbox" value="day1"> Day 1</label><br>
      <label><input type="checkbox" class="visitorDayCheckbox" value="day2"> Day 2</label><br>
      <label><input type="checkbox" class="visitorDayCheckbox" value="day3"> Day 3 (Star Nite)</label><br>
    </div>
    <div id="visitorEventsContainer"></div>
    <div class="participant-card" id="participantsContainerPlaceholder"></div>
  `;
}

function festPassUI() {
  // show all days events and a star nite toggle
  return `
    <div class="participant-card">
      <h4>Fest Pass — All Days</h4>
      <label><input type="checkbox" id="festStarNite"> Include Star Nite (adds ₹500)</label>
    </div>
    <div id="festEventsContainer">
      ${["day0","day1","day2","day3"].map(d => `
        <div class="participant-card">
          <h5>${d.toUpperCase()} Events</h5>
          ${EVENTS[d].map(ev => `<label><input type="checkbox" class="festEvent" data-day="${d}" value="${escapeQuotes(ev)}"> ${ev}</label><br>`).join("")}
        </div>
      `).join("")}
    </div>
    <div class="participant-card" id="participantsContainerPlaceholder"></div>
  `;
}

/* ---------------- utility to escape quotes for template strings ---------------- */
function escapeQuotes(s){ return String(s).replace(/"/g, '&quot;').replace(/'/g, "&#39;"); }

/* ---------------- event handlers for UI ---------------- */
function onDaySelect(e) {
  currentDay = e.target.value || null;
  includeStarNite = false;
  renderDayEvents(currentDay);
  calculateTotal();
}

function renderDayEvents(dayKey) {
  const container = document.getElementById("dayEventsContainer");
  if (!container) return;
  if (!dayKey) { container.innerHTML = ""; return; }

  const isDay3 = dayKey === "day3";
  const evs = EVENTS[dayKey] || [];
  container.innerHTML = `
    <div class="participant-card">
      <h4>Events for ${dayKey.toUpperCase()}</h4>
      ${evs.map(ev => {
        if (ev === "Star Nite") {
          return `<label><input type="checkbox" id="day3StarCheck"> Star Nite</label><br>`;
        }
        return `<label><input type="checkbox" class="dayEventCheck" data-day="${dayKey}" value="${escapeQuotes(ev)}"> ${ev}</label><br>`;
      }).join("")}
    </div>
  `;
  // attach star listener if present
  const starEl = document.getElementById("day3StarCheck");
  if (starEl) {
    starEl.addEventListener("change", (ev) => {
      includeStarNite = ev.target.checked;
      calculateTotal();
    });
  }
}

function onVisitorDayToggle() {
  currentVisitorDays = [...document.querySelectorAll(".visitorDayCheckbox:checked")].map(x => x.value);
  includeStarNite = false;
  renderVisitorEvents(currentVisitorDays);
  calculateTotal();
}

function renderVisitorEvents(days) {
  const container = document.getElementById("visitorEventsContainer");
  if (!container) return;
  if (!days || !days.length) { container.innerHTML = ""; return; }

  container.innerHTML = days.map(d => {
    const evs = EVENTS[d] || [];
    return `
      <div class="participant-card">
        <h4>${d.toUpperCase()} Events</h4>
        ${evs.map(ev => {
          if (ev === "Star Nite") {
            return `<label><input type="checkbox" class="visitorStar" data-day="${d}" id="visitor-star-${d}"> Star Nite</label><br>`;
          }
          return `<label><input type="checkbox" class="visitorEventCheck" data-day="${d}" value="${escapeQuotes(ev)}"> ${ev}</label><br>`;
        }).join("")}
      </div>
    `;
  }).join("");

  // attach star listeners for day3 if present
  days.forEach(d => {
    const el = document.getElementById(`visitor-star-${d}`);
    if (el) {
      el.addEventListener("change", (e) => {
        if (d === "day3") includeStarNite = e.target.checked;
        calculateTotal();
      });
    }
  });
}

/* ---------------- participant forms (auto-fill) ---------------- */
function buildParticipantForms(count) {
  const placeholder = document.getElementById("participantsContainerPlaceholder");
  if (!placeholder) return;
  participantsCount = count;
  placeholder.innerHTML = "";
  if (count <= 0) return;

  const cached = getCachedProfile();
  for (let i = 1; i <= count; i++) {
    const nameVal = (i === 1 && cached.name) ? cached.name : "";
    const emailVal = (i === 1 && cached.email) ? cached.email : "";
    const phoneVal = (i === 1 && cached.phone) ? cached.phone : "";
    const collegeVal = (i === 1 && cached.college) ? cached.college : "";

    const div = document.createElement("div");
    div.className = "participant-card";
    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input type="text" class="pname" placeholder="Full name" value="${escapeQuotes(nameVal)}" required>
      <input type="email" class="pemail" placeholder="Email" value="${escapeQuotes(emailVal)}" required>
      <input type="tel" class="pphone" placeholder="Phone" value="${escapeQuotes(phoneVal)}" required>
      <input type="text" class="pcollege" placeholder="College" value="${escapeQuotes(collegeVal)}" required>
    `;
    placeholder.appendChild(div);

    // attach small auto-fill name match - if typed name matches cached name, autofill rest
    const nameInput = div.querySelector(".pname");
    const emailInput = div.querySelector(".pemail");
    const phoneInput = div.querySelector(".pphone");
    const collegeInput = div.querySelector(".pcollege");

    nameInput.addEventListener("input", () => {
      const typed = (nameInput.value || "").trim().toLowerCase();
      if (cached.name && typed && typed === cached.name.trim().toLowerCase()) {
        if (cached.email) emailInput.value = cached.email;
        if (cached.phone) phoneInput.value = cached.phone;
        if (cached.college) collegeInput.value = cached.college;
        [emailInput, phoneInput, collegeInput].forEach(el => {
          el.style.boxShadow = "0 0 12px cyan";
          setTimeout(() => (el.style.boxShadow = ""), 800);
        });
      }
    });
  }

  calculateTotal();
}

/* ---------------- number buttons for participants ---------------- */
increaseBtn?.addEventListener("click", () => {
  let v = parseInt(numInput.value) || 0;
  if (v < 10) {
    numInput.value = ++v;
    buildParticipantForms(v);
  }
});
decreaseBtn?.addEventListener("click", () => {
  let v = parseInt(numInput.value) || 0;
  if (v > 0) {
    numInput.value = --v;
    buildParticipantForms(v);
  }
});

/* ---------------- calculate total according to rules ---------------- */
function calculateTotal() {
  let total = 0;

  if (!currentPassType) { totalAmountEl.textContent = `Total: ₹0`; return; }

  if (currentPassType === "Day Pass") {
    if (!currentDay) { totalAmountEl.textContent = `Total: ₹0`; return; }
    if (currentDay !== "day3") {
      total = PRICES.dayPass[currentDay] || 0;
    } else {
      total = includeStarNite ? PRICES.dayPass.day3_star : PRICES.dayPass.day3_normal;
    }
  } else if (currentPassType === "Visitor Pass") {
    const days = currentVisitorDays || [];
    days.forEach(d => {
      if (d !== "day3") total += PRICES.visitor[d] || 0;
      else total += includeStarNite ? PRICES.visitor.day3_star : PRICES.visitor.day3_normal;
    });
  } else if (currentPassType === "Fest Pass") {
    total = includeStarNite ? PRICES.fest.star : PRICES.fest.normal;
  }

  currentTotal = total;
  totalAmountEl.textContent = `Total: ₹${total}`;
  payBtn.style.display = (total > 0 && participantsCount > 0) ? "inline-block" : "none";
}

/* ---------------- collect selected events mapping ---------------- */
function collectSelectedEvents() {
  // return object: { day0: [..], day1: [...], ... }
  const out = {};
  ["day0","day1","day2","day3"].forEach(d => out[d] = []);

  // day pass single-day event checks
  document.querySelectorAll(".dayEventCheck").forEach(cb => {
    if (cb.checked) {
      const day = cb.dataset.day;
      out[day] = out[day] || [];
      out[day].push(cb.value);
    }
  });
  // visitor event checks
  document.querySelectorAll(".visitorEventCheck").forEach(cb => {
    if (cb.checked) {
      const day = cb.dataset.day;
      out[day] = out[day] || [];
      out[day].push(cb.value);
    }
  });
  // fest event checks
  document.querySelectorAll(".festEvent").forEach(cb => {
    if (cb.checked) {
      const day = cb.dataset.day;
      out[day] = out[day] || [];
      out[day].push(cb.value);
    }
  });

  // For star nite presence, we will keep includeStarNite flag
  return out;
}

/* ---------------- prepare Razorpay + send payload ---------------- */
payBtn?.addEventListener("click", async (ev) => {
  ev.preventDefault();
  if (paying) return;
  paying = true;

  // validate participants form
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

  // Build participants array
  const participants = names.map((n, i) => ({
    name: n, email: emails[i], phone: phones[i], college: colleges[i]
  }));

  // collect selected days, events
  const selectedEvents = collectSelectedEvents();
  const payloadMeta = {
    passType: currentPassType,
    totalAmount: currentTotal,
    participantsCount: participants.length,
    selectedDay: currentPassType === "Day Pass" ? currentDay : null,
    visitorDays: currentPassType === "Visitor Pass" ? currentVisitorDays : null,
    includeStarNite: !!includeStarNite,
    selectedEvents // per-day map
  };

  // prepare Razorpay payment
  const userEmail = auth?.currentUser?.email || (participants[0] && participants[0].email) || "";
  const options = {
    key: "rzp_test_Re1mOkmIGroT2c", // replace with production key when ready
    amount: Number(currentTotal) * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${currentPassType} — Registration`,
    image: "pravah-logo.png",
    prefill: { name: participants[0].name || "", email: participants[0].email || userEmail, contact: participants[0].phone || "" },
    handler: async function (response) {
      // on success, send payload to Apps Script
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

      // try sendBeacon
      let sent = false;
      try {
        if (navigator.sendBeacon) {
          sent = navigator.sendBeacon(scriptURL, new Blob([JSON.stringify(payload)], { type: "application/json" }));
        }
      } catch (e) { sent = false; }

      if (!sent) {
        try {
          await fetch(scriptURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true
          });
        } catch (err) {
          console.warn("post failed", err);
        }
      }

      // update profile cache for convenience
      const match = participants.find(p => p.email === userEmail) || participants[0];
      if (match) saveProfileCache({ name: match.name || "", email: match.email || "", phone: match.phone || "", college: match.college || "" });

      // redirect to success page
      window.location.href = "payment_success.html";
    },
    modal: { ondismiss: function() { paying = false; } }
  };

  // open Razorpay
  try {
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Razorpay launch error", err);
    paying = false;
    alert("Payment failed to start. Try again.");
  }
});

/* ---------------- recalc total whenever relevant inputs change ---------------- */
/* Recompute when relevant UI elements change */
document.addEventListener("change", (e) => {
  // day selection
  if (e.target && e.target.id === "daySelect") { currentDay = e.target.value; renderDayEvents(currentDay); calculateTotal(); return; }
  // visitor day checkboxes
  if (e.target && e.target.classList && e.target.classList.contains("visitorDayCheckbox")) {
    currentVisitorDays = [...document.querySelectorAll(".visitorDayCheckbox:checked")].map(x => x.value);
    renderVisitorEvents(currentVisitorDays);
    calculateTotal();
    return;
  }
  // star nite change (day3 on various UIs)
  if (e.target && e.target.id === "day3StarCheck") { includeStarNite = e.target.checked; calculateTotal(); return; }
  if (e.target && e.target.id === "visitor-star-day3") { includeStarNite = e.target.checked; calculateTotal(); return; }
  if (e.target && e.target.id === "festStarNite") { includeStarNite = e.target.checked; calculateTotal(); return; }
  // participant count change
  if (e.target && e.target.id === "numParticipants") {
    const v = parseInt(e.target.value) || 0;
    buildParticipantForms(v);
    calculateTotal();
  }
});

/* small initial calculation ticks in case UI already had state */
setTimeout(() => {
  cachedProfile = getCachedProfile();
  calculateTotal();
}, 120);

/* Exports (helpful for debugging in console) */
window.PRAVAAH_passModule = {
  EVENTS, PRICES, calculateTotal, buildParticipantForms, collectSelectedEvents, refreshProfileFromSheets
};

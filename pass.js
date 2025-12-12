// pass.js — PRAVAAH 2026 Pass system (updated per your requests)
// ===========================================================
// Changes in this update:
//  - After successful payment: participant form is cleared (fields emptied), numParticipants reset to 0,
//    but profile cache is kept (so auto-fill works when typed name matches cached profile).
//  - StarNite choice shown as a toggle at the BOTTOM of Day-3 events list (for Day & Fest flows).
//  - Starnite standalone pass price set to ₹300 (PRICES.starnite).
//  - Wider event-row HTML remains (CSS should handle actual width — update pass.css separately).
//  - Visitor pass shows event names only (no checkboxes).
//  - Day0 included but does not show event cards unless specified in EVENTS (behavior kept).
//  - Participant form required for all passes.
// ===========================================================

/* ---------------- BACKEND URL ---------------- */
const scriptURL = "https://script.google.com/macros/s/AKfycby4F5rBxS_-KLmP05Yqm-R7PmjIx9_7dMsa28D1xds3X2jWSMKini-AJ-1wgGR6EmvDlg/exec";

/* ---------------- EVENTS (placeholders) ---------------- */
const EVENTS = {
  day0: ["Event 1", "Event 2", "Event 3"],       // Day0 included but you can leave empty if you don't want cards shown
  day1: ["Event 1", "Event 2", "Event 3"],
  day2: ["Event 1", "Event 2", "Event 3"],
  day3: ["Event 1", "Event 2", "Event 3", "Star Nite"]
};

/* ---------------- PRICING ---------------- */
const PRICES = {
  dayPass: { day0: 300, day1: 800, day2: 800, day3_normal: 800, day3_star: 1100 },
  visitor: { day0: 400, day1: 500, day2: 500, day3_normal: 500, day3_star: 800 },
  fest: { normal: 2000, star: 2500 },
  starnite: 300 // updated: Starnite standalone pass price is ₹300
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

/* ---------------- DOM references (robust) ---------------- */
const passCards = document.querySelectorAll(".pass-card");
const selectionArea = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const participantForm = document.getElementById("participantForm");
const numInput = document.getElementById("numParticipants");
const decBtn = document.getElementById("decPart") || document.getElementById("decreaseBtn");
const incBtn = document.getElementById("incPart") || document.getElementById("increaseBtn");
const totalAmountEl = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");
const timerDisplay = document.getElementById("payment-timer");

/* ---------------- state ---------------- */
let currentPassType = null;      // "Day Pass" | "Visitor Pass" | "Fest Pass" | "Starnite Pass"
let currentDay = null;           // 'day0'..'day3' for Day Pass
let currentVisitorDays = [];     // array of 'day0'..'day3' for Visitor Pass
let includeStarNite = false;     // whether Star Nite included (Day3)
let participantsCount = 0;
let cachedProfile = {};          // from localStorage or Sheets
let currentTotal = 0;
let paying = false;

/* ---------------- helpers & regex ---------------- */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;
const RULEBOOK_URL = "rulebooks/sample.pdf"; // Option A — same link for all

function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem("profileData") || "{}"); } catch { return {}; }
}
function saveProfileCache(obj) {
  try { localStorage.setItem("profileData", JSON.stringify(obj || {})); } catch {}
}
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

/* ---------------- init profile on auth change ---------------- */
if (auth && auth.onAuthStateChanged) {
  auth.onAuthStateChanged(user => {
    cachedProfile = getCachedProfile();
    if ((!cachedProfile || !cachedProfile.email) && user && user.email) {
      saveProfileCache({ email: user.email });
      cachedProfile = getCachedProfile();
    }
    if (user && user.email) refreshProfileFromSheets(user.email);
  });
}

/* ---------------- UI helpers: render an event row ----------------
   Two modes:
   1) selectable = true -> show a box with checkbox on left and PDF icon to right
   2) selectable = false -> show a non-checkbox row with event name + pdf icon
   returns HTML string
-------------------------------------------------------------- */
function renderEventRow(eventName, opts = {}) {
  // opts: { dayKey, selectable, idPrefix }
  const dayKey = opts.dayKey || "";
  const selectable = !!opts.selectable;
  const idPrefix = opts.idPrefix || `ev_${dayKey}`;

  // use clean id safe
  const safeName = eventName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const checkboxId = `${idPrefix}_chk_${safeName}`;
  const pdfId = `${idPrefix}_pdf_${safeName}`;

  if (selectable) {
    // box layout with checkbox left, pdf right
    return `
      <div class="event-row" data-day="${dayKey}">
        <div class="event-left">
          <input type="checkbox" id="${checkboxId}" class="event-checkbox" data-day="${dayKey}" value="${escapeHtml(eventName)}">
          <label for="${checkboxId}" class="event-label">${escapeHtml(eventName)}</label>
        </div>
        <div class="event-right">
          <a id="${pdfId}" href="${RULEBOOK_URL}" target="_blank" rel="noopener noreferrer" title="Open rulebook">
            <i class="fa-regular fa-file-pdf pdf-icon"></i>
          </a>
        </div>
      </div>
    `;
  } else {
    // non-selectable: event name + pdf icon (no checkbox)
    return `
      <div class="event-row" data-day="${dayKey}">
        <div class="event-left">
          <span class="event-label">${escapeHtml(eventName)}</span>
        </div>
        <div class="event-right">
          <a href="${RULEBOOK_URL}" target="_blank" rel="noopener noreferrer" title="Open rulebook">
            <i class="fa-regular fa-file-pdf pdf-icon"></i>
          </a>
        </div>
      </div>
    `;
  }
}

/* small utility to escape html */
function escapeHtml(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

/* ---------------- attach click to pass cards ---------------- */
if (passCards && passCards.length) {
  passCards.forEach(card => {
    card.addEventListener("click", () => {
      passCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      // dataset: some HTML used data-type, others data-name — handle both
      currentPassType = card.dataset.type || card.dataset.name || card.getAttribute("data-type") || card.getAttribute("data-name") || card.textContent.trim();
      // normalize common variants
      if (/day/i.test(currentPassType)) currentPassType = "Day Pass";
      else if (/fest/i.test(currentPassType)) currentPassType = "Fest Pass";
      else if (/visitor/i.test(currentPassType)) currentPassType = "Visitor Pass";
      else if (/starnite/i.test(currentPassType)) currentPassType = "Starnite Pass";

      // reset selections
      currentDay = null;
      currentVisitorDays = [];
      includeStarNite = false;
      participantsCount = 0;
      if (numInput) numInput.value = 0;
      renderSelectionArea();
    });
  });
} else {
  console.warn("No .pass-card elements found in DOM");
}

/* ---------------- render selection area for the chosen pass ---------------- */
function renderSelectionArea() {
  if (!selectionArea) return;
  selectionArea.classList.remove("hidden");
  selectedPassTxt && (selectedPassTxt.textContent = `Selected: ${currentPassType || "—"}`);

  // reset placeholder
  participantForm && (participantForm.innerHTML = "");

  // Show pass-specific controls and event lists
  if (currentPassType === "Day Pass") {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Choose Day</h4>
        <div id="daySelectorRow" class="day-selector-row">
          <!-- horizontal day cards -->
          <button class="day-card" data-day="day0">Day 0</button>
          <button class="day-card" data-day="day1">Day 1</button>
          <button class="day-card" data-day="day2">Day 2</button>
          <button class="day-card" data-day="day3">Day 3</button>
        </div>
      </div>
      <div id="dayEventsContainer"></div>
      <div class="participant-card" id="participantsContainerPlaceholder"></div>
    `;
    // attach day-card click handlers (horizontal)
    document.querySelectorAll("#daySelectorRow .day-card").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll("#daySelectorRow .day-card").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        currentDay = btn.dataset.day;
        includeStarNite = false;
        renderDayEvents(currentDay);
        calculateTotal();
      });
    });
  }
  else if (currentPassType === "Visitor Pass") {
    // Visitor: date-wise checkboxes (user asked visitor pass should just display the event names according to date wise)
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Choose Days to Visit</h4>
        <div id="visitorDaysRow" class="visitor-days-row">
          <label><input type="checkbox" class="visitorDayCheckbox" value="day0"> Day 0</label>
          <label><input type="checkbox" class="visitorDayCheckbox" value="day1"> Day 1</label>
          <label><input type="checkbox" class="visitorDayCheckbox" value="day2"> Day 2</label>
          <label><input type="checkbox" class="visitorDayCheckbox" value="day3"> Day 3</label>
        </div>
      </div>
      <div id="visitorEventsContainer"></div>
      <div class="participant-card" id="participantsContainerPlaceholder"></div>
    `;
    // attach handlers
    document.querySelectorAll(".visitorDayCheckbox").forEach(cb => cb.addEventListener("change", () => {
      currentVisitorDays = [...document.querySelectorAll(".visitorDayCheckbox:checked")].map(x => x.value);
      includeStarNite = false;
      renderVisitorEvents(currentVisitorDays);
      calculateTotal();
    }));
  }
  else if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Fest Pass — All Days</h4>
        <div id="festDaysRow" class="day-selector-row">
          <button class="day-card" data-day="day0">Day 0</button>
          <button class="day-card" data-day="day1">Day 1</button>
          <button class="day-card" data-day="day2">Day 2</button>
          <button class="day-card" data-day="day3">Day 3</button>
        </div>
      </div>
      <div id="festEventsContainer"></div>
      <div class="participant-card" id="participantsContainerPlaceholder"></div>
    `;
    // render fest events (all days shown horizontally in their own cards)
    renderFestEvents();

    // star toggle for day3 must appear at bottom of day3 events (handled inside renderFestEvents)
  }
  else if (currentPassType === "Starnite Pass") {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Starnite Pass</h4>
        <p>Standalone Starnite access (Day 3)</p>
      </div>
      <div id="starniteEventsContainer"></div>
      <div class="participant-card" id="participantsContainerPlaceholder"></div>
    `;
    const container = document.getElementById("starniteEventsContainer");
    if (container) {
      container.innerHTML = `
        <div class="participant-card">
          <h4>Day 3 Events</h4>
          ${EVENTS.day3.map(ev => renderEventRow(ev, { dayKey: "day3", selectable: true, idPrefix: "starnite" })).join("")}
          <!-- bottom star toggle (for consistency, but Starnite pass itself is standalone price) -->
          <div class="starnite-toggle" style="margin-top:10px">
            <label><input type="checkbox" id="starnite_confirm"> Confirm Starnite Access</label>
          </div>
        </div>
      `;
      // toggle doesn't change price here because starnite pass is fixed price; it's only a confirmation UI.
      document.getElementById("starnite_confirm")?.addEventListener("change", (e) => {
        // no-op price-wise; but we map includeStarNite to true if checked
        includeStarNite = !!e.target.checked;
      });
    }
  }

  // Ensure participants container exists and is empty
  const placeholder = document.getElementById("participantsContainerPlaceholder");
  if (placeholder) placeholder.innerHTML = "";

  // Recompute totals & update pay button
  calculateTotal();
}

/* ---------------- render Day events (Day Pass) ---------------- */
function renderDayEvents(dayKey) {
  const container = document.getElementById("dayEventsContainer");
  if (!container) return;
  if (!dayKey) { container.innerHTML = ""; return; }

  const evs = EVENTS[dayKey] || [];
  // For Day Pass: show selectable checkboxes for events (except Star Nite toggle placed at bottom)
  container.innerHTML = `
    <div class="participant-card">
      <h4>Events for ${dayKey.toUpperCase()}</h4>
      <div class="events-list">
        ${evs.filter(ev => ev !== "Star Nite").map(ev => renderEventRow(ev, { dayKey, selectable: true, idPrefix: `day_${dayKey}` })).join("")}
      </div>
      <!-- bottom StarNite toggle for day3 -->
      ${dayKey === "day3" ? `
        <div class="starnite-bottom" style="margin-top:10px;display:flex;align-items:center;gap:10px;justify-content:flex-start">
          <label style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="day3StarToggle">
            <span>Include Star Nite (Day 3)</span>
          </label>
        </div>
      ` : ""}
    </div>
  `;

  // attach star listener (bottom toggle)
  const starToggle = document.getElementById("day3StarToggle");
  if (starToggle) {
    starToggle.addEventListener("change", (ev) => {
      includeStarNite = !!ev.target.checked;
      calculateTotal();
    });
  }
}

/* ---------------- render Visitor events (no checkboxes) ---------------- */
function renderVisitorEvents(days) {
  const container = document.getElementById("visitorEventsContainer");
  if (!container) return;
  if (!days || !days.length) { container.innerHTML = ""; return; }

  container.innerHTML = days.map(d => {
    const evs = EVENTS[d] || [];
    return `
      <div class="participant-card">
        <h4>${d.toUpperCase()} Events</h4>
        <div class="events-list">
          ${evs.map(ev => renderEventRow(ev, { dayKey: d, selectable: false })).join("")}
        </div>
      </div>
    `;
  }).join("");
}

/* ---------------- render Fest events (checkboxes for all days) ---------------- */
function renderFestEvents() {
  const container = document.getElementById("festEventsContainer");
  if (!container) return;

  container.innerHTML = ["day0","day1","day2","day3"].map(d => {
    const evs = EVENTS[d] || [];
    return `
      <div class="participant-card">
        <h5 style="margin-bottom:10px">${d.toUpperCase()} Events</h5>
        <div class="events-list">
          ${evs.filter(ev => ev !== "Star Nite").map(ev => renderEventRow(ev, { dayKey: d, selectable: true, idPrefix: `fest_${d}` })).join("")}
        </div>
        ${d === "day3" ? `
          <div class="starnite-bottom" style="margin-top:10px;display:flex;align-items:center;gap:10px;justify-content:flex-start">
            <label style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="fest_day3_starnite">
              <span>Include Star Nite (Day 3)</span>
            </label>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  // attach listener for day3 star checkbox (delegated)
  setTimeout(() => {
    const el = document.getElementById("fest_day3_starnite");
    if (el) el.addEventListener("change", (e) => { includeStarNite = !!e.target.checked; calculateTotal(); });
  }, 50);
}

/* ---------------- build participant forms (required for all passes) ---------------- */
function buildParticipantForms(count) {
  const placeholder = document.getElementById("participantsContainerPlaceholder");
  if (!placeholder) return;
  participantsCount = count;
  placeholder.innerHTML = "";
  if (count <= 0) {
    calculateTotal();
    return;
  }

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
      <input type="text" class="pname" placeholder="Full name" value="${escapeHtml(nameVal)}" required>
      <input type="email" class="pemail" placeholder="Email" value="${escapeHtml(emailVal)}" required>
      <input type="tel" class="pphone" placeholder="Phone" value="${escapeHtml(phoneVal)}" required>
      <input type="text" class="pcollege" placeholder="College" value="${escapeHtml(collegeVal)}" required>
    `;
    placeholder.appendChild(div);

    // auto-fill behaviour: if typed name matches cached name, fill rest
    const nameInput = div.querySelector(".pname");
    const emailInput = div.querySelector(".pemail");
    const phoneInput = div.querySelector(".pphone");
    const collegeInput = div.querySelector(".pcollege");
    nameInput && nameInput.addEventListener("input", () => {
      const typed = (nameInput.value || "").trim().toLowerCase();
      if (cached.name && typed && typed === cached.name.trim().toLowerCase()) {
        if (cached.email) emailInput.value = cached.email;
        if (cached.phone) phoneInput.value = cached.phone;
        if (cached.college) collegeInput.value = cached.college;
        [emailInput, phoneInput, collegeInput].forEach(el => {
          el.style.boxShadow = "0 0 12px cyan";
          setTimeout(() => (el.style.boxShadow = ""), 700);
        });
      }
    });
  }

  calculateTotal();
}

/* ---------------- participants + / - handlers (support both id variants) ---------------- */
if (incBtn) {
  incBtn.addEventListener("click", () => {
    let v = parseInt(numInput.value) || 0;
    if (v < 10) {
      numInput.value = ++v;
      buildParticipantForms(v);
    }
  });
}
if (decBtn) {
  decBtn.addEventListener("click", () => {
    let v = parseInt(numInput.value) || 0;
    if (v > 0) {
      numInput.value = --v;
      buildParticipantForms(v);
    }
  });
}
// also support manual typing into input
if (numInput) {
  numInput.addEventListener("input", () => {
    let v = parseInt(numInput.value) || 0;
    if (v < 0) v = 0;
    if (v > 10) v = 10;
    numInput.value = v;
    buildParticipantForms(v);
  });
}

/* ---------------- calculate total ---------------- */
function calculateTotal() {
  let total = 0;
  if (!currentPassType) { totalAmountEl && (totalAmountEl.textContent = `Total: ₹0`); return; }

  if (currentPassType === "Day Pass") {
    if (!currentDay) { totalAmountEl && (totalAmountEl.textContent = `Total: ₹0`); return; }
    if (currentDay !== "day3") total = PRICES.dayPass[currentDay] || 0;
    else total = includeStarNite ? PRICES.dayPass.day3_star : PRICES.dayPass.day3_normal;
  }
  else if (currentPassType === "Visitor Pass") {
    const days = currentVisitorDays || [];
    days.forEach(d => {
      if (d !== "day3") total += PRICES.visitor[d] || 0;
      else total += includeStarNite ? PRICES.visitor.day3_star : PRICES.visitor.day3_normal;
    });
  }
  else if (currentPassType === "Fest Pass") {
    total = includeStarNite ? PRICES.fest.star : PRICES.fest.normal;
  }
  else if (currentPassType === "Starnite Pass") {
    // standalone starnite price
    total = PRICES.starnite || 300;
  }

  currentTotal = total;
  totalAmountEl && (totalAmountEl.textContent = `Total: ₹${total}`);
  payBtn && (payBtn.style.display = (total > 0 && participantsCount > 0) ? "inline-block" : "none");
}

/* ---------------- collect selected events mapping ---------------- */
function collectSelectedEvents() {
  const out = { day0: [], day1: [], day2: [], day3: [] };

  document.querySelectorAll(".event-checkbox").forEach(cb => {
    if (cb.checked) {
      const day = cb.dataset.day || "";
      if (!out[day]) out[day] = [];
      out[day].push(cb.value);
    }
  });

  // also include any checkboxes with older classes to be safe
  document.querySelectorAll(".dayEventCheck, .festEvent, .visitorEventCheck").forEach(cb => {
    if (cb.checked) {
      const day = cb.dataset.day || "";
      if (!out[day]) out[day] = [];
      out[day].push(cb.value);
    }
  });

  return out;
}

/* ---------------- prepare Razorpay + send payload ---------------- */
if (payBtn) {
  payBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
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

        // try sendBeacon
        let sent = false;
        try {
          if (navigator.sendBeacon) sent = navigator.sendBeacon(scriptURL, new Blob([JSON.stringify(payload)], { type: "application/json" }));
        } catch (e) { sent = false; }

        if (!sent) {
          try {
            await fetch(scriptURL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true });
          } catch (err) { console.warn("post failed", err); }
        }

        // save the first participant as cached profile (so auto-fill works next time when typing same name)
        const match = participants.find(p => p.email === userEmail) || participants[0];
        if (match) saveProfileCache({ name: match.name || "", email: match.email || "", phone: match.phone || "", college: match.college || "" });

        // AFTER success: clear the participant forms and reset counts (but keep cache)
        // clear UI: remove participant cards, set numParticipants to 0, hide pay button
        const placeholder = document.getElementById("participantsContainerPlaceholder");
        if (placeholder) placeholder.innerHTML = "";
        if (numInput) numInput.value = 0;
        participantsCount = 0;
        paying = false;
        currentTotal = 0;
        if (totalAmountEl) totalAmountEl.textContent = "Total: ₹0";
        if (payBtn) payBtn.style.display = "none";

        // Optionally reset selection area and pass cards (I will keep selection visible but unselect cards)
        passCards.forEach(c => c.classList.remove("selected"));
        if (selectionArea) selectionArea.classList.add("hidden");
        currentPassType = null;
        currentDay = null;
        currentVisitorDays = [];
        includeStarNite = false;

        // redirect to success page
        window.location.href = "payment_success.html";
      },
      modal: { ondismiss: function() { paying = false; } }
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
} else {
  console.warn("payBtn not found in DOM (id='payBtn')");
}

/* ---------------- global change listener for some dynamic controls ---------------- */
document.addEventListener("change", (e) => {
  // visitor day checkboxes:
  if (e.target && e.target.classList && e.target.classList.contains("visitorDayCheckbox")) {
    currentVisitorDays = [...document.querySelectorAll(".visitorDayCheckbox:checked")].map(x => x.value);
    renderVisitorEvents(currentVisitorDays);
    calculateTotal();
    return;
  }
  // fest day3 star checkbox
  if (e.target && e.target.id === "fest_day3_starnite") { includeStarNite = !!e.target.checked; calculateTotal(); return; }
  if (e.target && e.target.id === "day3StarToggle") { includeStarNite = !!e.target.checked; calculateTotal(); return; }
  // number typed directly
  if (e.target && e.target.id === "numParticipants") {
    const v = parseInt(e.target.value) || 0;
    buildParticipantForms(v);
    calculateTotal();
    return;
  }
});

/* initial sync */
setTimeout(() => {
  cachedProfile = getCachedProfile();
  calculateTotal();
}, 120);

/* Expose small API for debugging from console */
window.PRAVAAH_passModule = {
  EVENTS, PRICES, calculateTotal, buildParticipantForms, collectSelectedEvents, refreshProfileFromSheets
};

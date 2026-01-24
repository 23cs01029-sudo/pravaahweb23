/*******************************
 *  PRAVAAH 2026 — FINAL SCRIPT.JS
 *  (Complete working version)
 *******************************/

import { auth, initAuth } from "./auth.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

initAuth({
  requireAuth: true,
  redirectTo: "index.html",
  showDashboard: true
});


const scriptURL = "/api/pravaah";


/* =======================================
      EVENTS & PRICES
======================================= */
const EVENTS = {
  day0: [],
  day1: [
  "Fashion Show",
  "Data Science Hackathon",
  "General Quiz",
  "Marcatus",
  "Startup Expo",
  "Face Painting",
  "Robo Soccer",
  "51-Hour Short Film",
  "Abhinay(StagePlay)"
],
 day2: [
  "Comedy Night",
  "Web Hackathon",
  "Science & Technology Quiz",
  "B-Plan",
  "Enigma",
  "Innovation Expo",
  "Blast Off",
  "Robo Race",
  "Monoact",
  "Tamasha(Nukkad)"
],

day3: [
  "StarNite",
  "DJ Night",
  "IPL Auction",
  "Solo Dance",
  "Group Dance",
  "Trekkon-Line Follower",
  "Street Battle"
]

};

const PRICES = {
  dayPass: {
    day0: 99,
    day1: 199,
    day2: 199,
    day3: 249
  },

  visitor: {
    day0: 99,
    day1: 149,
    day2: 149,
    day3: 199
  },

  fest: {
    normal: 599
  },

  starnite: 99
};

const IITBBS_DOMAIN = "@iitbbs.ac.in";

function isIITBBSUser() {
  return auth.currentUser?.email?.endsWith(IITBBS_DOMAIN);
}

function getRegistrations() {
  return JSON.parse(localStorage.getItem("pravaah_user_regs") || "{}");
}

function saveRegistrations(data) {
  localStorage.setItem("pravaah_user_regs", JSON.stringify(data));
}

let selectedEventsByDay = {};

const DAY_ORDER = ["day0", "day1", "day2", "day3"];

function sortDays(arr) {
  return [...new Set(arr)].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
}

/* =======================================
      DOM ELEMENTS
======================================= */
const passCards = document.querySelectorAll(".pass-card");
const selectionArea = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const participantForm = document.getElementById("participantForm");

const totalAmountEl = document.getElementById("totalAmount");
totalAmountEl.style.display = "none";

const payBtn = document.getElementById("payBtn");
if (payBtn) payBtn.setAttribute("type", "button");

let currentPassType = null;
let currentDayPassDays = [];
let currentVisitorDays = [];

let participantsCount = 0;

let cachedProfile = {};
let currentTotal = 0;
let paying = false;

const RULEBOOK_URL = "sponsorship-brochure.pdf";


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

onAuthStateChanged(auth, (u) => {
  if (u?.email) refreshProfileFromSheets(u.email);
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (e) {
      alert("Logout failed");
      console.error(e);
    }
  };

  logoutDesktop?.addEventListener("click", logout);
  logoutMobile?.addEventListener("click", logout);
});
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

    let t = c.dataset.type;
    if (/day/i.test(t)) t = "Day Pass";
    else if (/visitor/i.test(t)) t = "Visitor Pass";
    else if (/fest/i.test(t)) t = "Fest Pass";
    else if (/star/i.test(t)) t = "Starnite Pass";

    const regs = getRegistrations();

    // ❌ Block other passes if Fest already registered
    if (regs.fest && t !== "Fest Pass" && isIITBBSUser()) {
  alert("IITBBS users cannot register again after Fest Pass.");
  return;
}
    passCards.forEach((x) => x.classList.remove("selected"));
    c.classList.add("selected");

    currentPassType = t;
currentDayPassDays = [];
currentVisitorDays = [];
participantsCount = 0;
selectedEventsByDay = {}; // ✅ RESET EVENTS WHEN PASS CHANGES


    renderSelectionArea();
  });
});


/* =======================================
      STAR NITE TOGGLE TEMPLATE
======================================= */


/* =======================================
      RENDER SELECTION AREA
======================================= */
function renderSelectionArea() {
  if (isIITBBSUser()) {
  payBtn.textContent = "Register";
  payBtn.style.display = "inline-block";
  totalAmountEl.style.display = "none"; // hide for IITBBS
} else {
  // ✅ NON-IITBBS USERS → show total area
  totalAmountEl.style.display = "block";
}




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

    <!-- EVENTS FIRST -->
<div id="eventHint" style="display:none;text-align:center;margin-top:10px;font-weight:600;color:#4cff88;">
  Select the events
</div>
<div id="dayEventsContainer"></div>


    <!-- THEN PARTICIPANTS -->
    <div style="text-align:center;margin-top:18px;">
      <h3>Number of Participants</h3>
      <div class="custom-number-box">
        <button type="button" class="num-btn" id="decPart">−</button>
<input type="number" id="numParticipants" value="0" min="0" max="10">
<button type="button" class="num-btn" id="incPart">+</button>

      </div>
    </div>

    <div id="participantsContainerPlaceholder"></div>
  `;

    document.querySelectorAll(".day-card").forEach((btn) =>
  btn.addEventListener("click", () => {
  const d = btn.dataset.day;

  const regs = getRegistrations();
  if (regs.days?.includes(d) && isIITBBSUser()) {
    alert("IITBBS users cannot register again for the same day.");
    return;
  }

  if (currentDayPassDays.includes(d)) {
    currentDayPassDays = currentDayPassDays.filter(x => x !== d);
    btn.classList.remove("active");
  } else {
    currentDayPassDays = sortDays([...currentDayPassDays, d]);
    btn.classList.add("active");
  }

  // ✅ SHOW "Select the events"
  const hint = document.getElementById("eventHint");
  if (hint) hint.style.display = "block";

  renderDayEvents(currentDayPassDays);
  calculateTotal();
});


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

    <!-- EVENTS FIRST -->
<div id="eventHint" style="display:none;text-align:center;margin-top:10px;font-weight:600;color:#4cff88;">
  Select the events
</div>
<div id="visitorEventsContainer"></div>

    

    <!-- PARTICIPANTS NEXT -->
    <div style="text-align:center;margin-top:18px;">
      <h3>Number of Participants</h3>
      <div class="custom-number-box">
        <button type="button" class="num-btn" id="decPart">−</button>
<input type="number" id="numParticipants" value="0" min="0" max="10">
<button type="button" class="num-btn" id="incPart">+</button>

      </div>
    </div>

    <div id="participantsContainerPlaceholder"></div>
  `;

    document.querySelectorAll(".visitor-day-card").forEach((btn) =>
      btn.addEventListener("click", () => {
        let d = btn.dataset.day;
const regs = getRegistrations();
if (regs.days?.includes(d) && isIITBBSUser()) {
  alert("IITBBS users cannot register again for the same day.");
  return;
}
        if (currentVisitorDays.includes(d)) {
          currentVisitorDays = currentVisitorDays.filter((x) => x !== d);
          btn.classList.remove("active");
        } else {
          currentVisitorDays = sortDays([...currentVisitorDays, d]);
          btn.classList.add("active");
        }

        renderVisitorEvents(currentVisitorDays);
        calculateTotal();

      })
    );
  }

  /* ---------- FEST PASS ---------- */
  if (currentPassType === "Fest Pass") {
    participantForm.innerHTML = `
    <div class="participant-card"><h4>Fest Pass (All Days)</h4></div>

    <!-- EVENTS FIRST -->
<div id="eventHint" style="display:none;text-align:center;margin-top:10px;font-weight:600;color:#4cff88;">
  Select the events
</div>
<div id="festEventsContainer"></div>
>

    <!-- PARTICIPANTS BELOW -->
    <div style="text-align:center;margin-top:18px;">
      <h3>Number of Participants</h3>
      <div class="custom-number-box">
        <button type="button" class="num-btn" id="decPart">−</button>
<input type="number" id="numParticipants" value="0" min="0" max="10">
<button type="button" class="num-btn" id="incPart">+</button>

      </div>
    </div>

    <div id="participantsContainerPlaceholder"></div>
  `;

    renderFestEvents();
  }

  /* ---------- STARNITE PASS ---------- */
  if (currentPassType === "Starnite Pass") {
    if (isIITBBSUser()) {
    participantForm.innerHTML = `
      <div class="participant-card">
        <h4>Starnite Pass</h4>
        <p style="color:#4cff88;font-weight:600;">
          IITBBS students need not register for Starnite.
        </p>
      </div>
    `;
    payBtn.style.display = "none";
    return;
  }
    participantForm.innerHTML = `
    <div class="participant-card"><h4>Starnite Pass</h4></div>

    <div style="text-align:center;margin-top:18px;">
      <h3>Number of Participants</h3>
      <div class="custom-number-box">
        <button type="button" class="num-btn" id="decPart">−</button>
<input type="number" id="numParticipants" value="0" min="0" max="10">
<button type="button" class="num-btn" id="incPart">+</button>

      </div>
    </div>

    <div id="participantsContainerPlaceholder"></div>
  `;
  }
  // 🔒 IITBBS USERS — FORCE SINGLE PARTICIPANT
if (isIITBBSUser()) {
  const counterBox = document.querySelector(".custom-number-box");
  if (counterBox) counterBox.style.display = "none";

  const numInput = document.getElementById("numParticipants");
  if (numInput) {
    numInput.value = 1;
    numInput.setAttribute("disabled", "true");
  }

  participantsCount = 1;
  buildParticipantForms(1);
}

attachParticipantControls(); 
  calculateTotal();

}
function attachParticipantControls(){
  if (isIITBBSUser()) return;
  const numInputLocal = document.getElementById("numParticipants");
  const incLocal = document.getElementById("incPart");
  const decLocal = document.getElementById("decPart");

  if(!numInputLocal || !incLocal || !decLocal) return; // prevent crash

  incLocal.addEventListener("click", () => {
    let v = +numInputLocal.value || 0;
    if (v < 10) v++;
    numInputLocal.value = v;
    buildParticipantForms(v);
  });

  decLocal.addEventListener("click", () => {
    let v = +numInputLocal.value || 0;
    if (v > 0) v--;
    numInputLocal.value = v;
    buildParticipantForms(v);
  });

  numInputLocal.addEventListener("input", () => {
    let v = +numInputLocal.value || 0;
    if (v < 0) v = 0;
    if (v > 10) v = 10;
    numInputLocal.value = v;
    buildParticipantForms(v);
  });
}
function renderAccordion(containerId, days, selectable) {
  const container = document.getElementById(containerId);
  if (!container) return;

  /* ===== SAVE CURRENT SELECTIONS ===== */
  document.querySelectorAll(".event-checkbox").forEach(cb => {
    const day = cb.dataset.day;
    if (!selectedEventsByDay[day]) selectedEventsByDay[day] = [];

    if (cb.checked && !selectedEventsByDay[day].includes(cb.value)) {
      selectedEventsByDay[day].push(cb.value);
    }

    if (!cb.checked) {
      selectedEventsByDay[day] =
        selectedEventsByDay[day]?.filter(v => v !== cb.value);
    }
  });

  if (!days.length) {
    container.innerHTML = "";
    return;
  }

  const isFest = currentPassType === "Fest Pass";

  container.innerHTML = days.map(d => {

    /* 🚫 DAY 0 — NO EVENTS, NO DROPDOWN */
    if (!EVENTS[d] || EVENTS[d].length === 0) {
      return `
        <div class="day-accordion no-events">
          <div class="day-accordion-header">
            <span>${d.toUpperCase()}</span>
          </div>
        </div>
      `;
    }

    /* 🎯 OPEN LOGIC */
    const shouldOpen =
      !isFest && selectedEventsByDay[d]?.length > 0;

    return `
      <div class="day-accordion ${shouldOpen ? "open" : ""}" data-day="${d}">
        <div class="day-accordion-header">
          <span>${d.toUpperCase()}</span>
          <div class="dropdown-arrow"></div>
        </div>

        <div class="day-accordion-content">
          ${EVENTS[d].map(e =>
            renderEventRow(e, { dayKey: d, selectable })
          ).join("")}
        </div>
      </div>
    `;
  }).join("");

  /* ===== RESTORE CHECKED EVENTS ===== */
  document.querySelectorAll(".event-checkbox").forEach(cb => {
    const day = cb.dataset.day;
    if (selectedEventsByDay[day]?.includes(cb.value)) {
      cb.checked = true;
    }
  });

  /* ===== TOGGLE HANDLER ===== */
  container.querySelectorAll(".day-accordion-header").forEach(h => {
    h.addEventListener("click", () => {
      const parent = h.parentElement;
      if (parent.classList.contains("no-events")) return;
      parent.classList.toggle("open");
    });
  });
}



/* =======================================
      RENDER DAY PASS EVENTS
======================================= */
function renderDayEvents(days) {
  renderAccordion("dayEventsContainer", [...new Set(days)], true);
}

/* =======================================
      VISITOR PASS EVENTS
======================================= */
function renderVisitorEvents(days) {
  renderAccordion("visitorEventsContainer", [...new Set(days)], false);
}

/* =======================================
      FEST EVENTS
======================================= */

function renderFestEvents() {
  currentDayPassDays = ["day0", "day1", "day2", "day3"];
  selectedEventsByDay = {}; // reset selections for fest
  renderAccordion("festEventsContainer", currentDayPassDays, true);
}



/* =======================================
      PARTICIPANT FORM GENERATION
======================================= */
function buildParticipantForms(count) {
  participantsCount = count;
  const c = document.getElementById("participantsContainerPlaceholder");
  c.innerHTML = "";

  if (count <= 0) {
    calculateTotal();
    return;
  }

  const profile = getCachedProfile();

  for (let i = 1; i <= count; i++) {

    const div = document.createElement("div");
    div.className = "participant-card";

    div.innerHTML = `
      <h4>Participant ${i}</h4>

      <input class="pname" placeholder="Full name">
<input class="pemail" placeholder="Email">
<input class="pphone" placeholder="Phone">
<input class="pcollege" placeholder="College">

    `;

    const nameInput = div.querySelector(".pname");
    const emailInput = div.querySelector(".pemail");
    const phoneInput = div.querySelector(".pphone");
    const collegeInput = div.querySelector(".pcollege");

    /* ✅ SMART AUTOFILL — WORKS FOR ALL PARTICIPANTS */
   nameInput.addEventListener("input", () => {
  const nameVal = nameInput.value.trim();

  /* 🔴 NAME CLEARED → CLEAR ALL DETAILS */
  if (nameVal === "") {
    emailInput.value = "";
    phoneInput.value = "";
    collegeInput.value = "";
    return;
  }

  /* 🟢 NAME MATCHES PROFILE → AUTOFILL */
  if (
    profile.name &&
    nameVal.toLowerCase() === profile.name.trim().toLowerCase()
  ) {
    emailInput.value = profile.email || "";
    phoneInput.value = profile.phone || "";
    collegeInput.value = profile.college || "";
  }
  /* 🟠 NAME DOES NOT MATCH → CLEAR */
  else {
    emailInput.value = "";
    phoneInput.value = "";
    collegeInput.value = "";
  }

});
    c.appendChild(div);
  }
  calculateTotal();
}

/* =======================================
      PRICE CALCULATION
      Total = base × participants 
======================================= */
function calculateTotal() {
  let base = 0;

  if (currentPassType === "Day Pass") {
    if (!currentDayPassDays.length) return updateTotal(0);

    currentDayPassDays.forEach(d => {
      base += PRICES.dayPass[d];
    });
  }

  if (currentPassType === "Visitor Pass") {
    currentVisitorDays.forEach(d => {
      base += PRICES.visitor[d];
    });
  }

  if (currentPassType === "Fest Pass") {
    base = PRICES.fest.normal;
  }

  if (currentPassType === "Starnite Pass") {
    base = PRICES.starnite;
  }

  updateTotal(base * participantsCount);
}

function updateTotal(amount) {
  if (isIITBBSUser()) {
    totalAmountEl.style.display = "none";
    payBtn.style.display = "inline-block";
    return;
  }

  currentTotal = amount;
  totalAmountEl.textContent = `Total: ₹${amount}`;
  payBtn.style.display = amount > 0 ? "inline-block" : "none";
}


/* =======================================
      EVENT COLLECTION
======================================= */
function collectSelectedEvents() {
  const events = {};

  document.querySelectorAll(".event-checkbox:checked").forEach((c) => {
    const day = c.dataset.day; // ✅ day0/day1/day2/day3 (lowercase)

    if (!events[day]) events[day] = [];
    events[day].push(c.value);
  });

  return events;
}

function completeFreeRegistration() {
  const numInputLocal = document.getElementById("numParticipants");
  const count = parseInt(numInputLocal?.value || 0);

  if (count <= 0) {
    alert("Please add at least 1 participant.");
    return;
  }

  const cards = [
    ...document.querySelectorAll(
      "#participantsContainerPlaceholder .participant-card"
    )
  ];

  const participants = cards.map(c => ({
    name: c.querySelector(".pname")?.value.trim(),
    email: c.querySelector(".pemail")?.value.trim(),
    phone: c.querySelector(".pphone")?.value.trim(),
    college: c.querySelector(".pcollege")?.value.trim()
  }));

  for (let p of participants) {
    if (!p.name || !p.email || !p.phone || !p.college) {
      alert("Fill all participant fields.");
      return;
    }
  }
  // 🔒 IITBBS EMAIL STRICT CHECK
const loggedInEmail = auth.currentUser.email.toLowerCase();

for (let p of participants) {
  if (p.email.toLowerCase() !== loggedInEmail) {
    alert(
      "IITBBS students must register using the same IITBBS email as their profile."
    );
    return;
  }
}

  const regs = getRegistrations();
  if (!regs.days) regs.days = [];

  regs.days.push(...currentDayPassDays, ...currentVisitorDays);

  if (currentPassType === "Fest Pass") {
    regs.fest = true;
  }

  // 🔥 Generate fake unique UTR for IITBBS
const fakePaymentId =
  "IITBBS_" +
  Date.now() +
  "_" +
  Math.random().toString(36).slice(2, 8).toUpperCase();

// 🔐 Create pass object like paid users
const freePassSession = {
  paymentId: fakePaymentId,
  passType: currentPassType,
  totalAmount: 0,
  participants,
  daySelected: currentDayPassDays,
  visitorDays: currentVisitorDays,
  starnite: currentPassType === "Starnite Pass",
  events: collectSelectedEvents(),
  registeredEmail: auth.currentUser.email
};

// Save so backend / profile can read it
localStorage.setItem(
  "pravaah_payment",
  JSON.stringify(freePassSession)
);

saveRegistrations(regs);

alert("Registration successful!");
window.location.href = "profile.html";
}




/* =======================================
      PAYMENT HANDLER
======================================= */
payBtn.addEventListener("click", async () => {
  // ✅ IITBBS USERS — NO PAYMENT, DIRECT REGISTER
if (isIITBBSUser()) {
  completeFreeRegistration();
  return;
}

  if (paying) return;
  paying = true;

  const numInputLocal = document.getElementById("numParticipants");
  if (!numInputLocal) {
    alert("Please select a pass and number of participants.");
    paying = false;
    return;
  }

  participantsCount = parseInt(numInputLocal.value) || 0;
  if (participantsCount <= 0) {
    alert("Please add at least 1 participant.");
    paying = false;
    return;
  }

  const cards = [
    ...document.querySelectorAll(
      "#participantsContainerPlaceholder .participant-card"
    )
  ];

  const participants = cards.map(c => ({
    name: c.querySelector(".pname")?.value.trim(),
    email: c.querySelector(".pemail")?.value.trim(),
    phone: c.querySelector(".pphone")?.value.trim(),
    college: c.querySelector(".pcollege")?.value.trim()
  }));

  for (let p of participants) {
    if (!p.name || !p.email || !p.phone || !p.college) {
      alert("Fill all participant fields.");
      paying = false;
      return;
    }
  }

  /* 🔐 CREATE PAYMENT SESSION — FINAL CLEAN VERSION */
  const paymentSession = {
    sessionId: "PAY_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
    createdAt: Date.now(),
    expiresAt: new Date().setHours(23, 59, 59, 999),

    registeredEmail: auth.currentUser.email,
    passType: currentPassType,
    totalAmount: currentTotal,

    participants,
    daySelected: currentDayPassDays,
    visitorDays: currentVisitorDays,

    // ✅ StarNite ONLY if pass itself is StarNite
    starnite: currentPassType === "Starnite Pass",

    events: collectSelectedEvents()
  };

  /* 💾 SAVE SESSION */
  localStorage.setItem(
    "pravaah_payment",
    JSON.stringify(paymentSession)
  );
  const regs = getRegistrations();
if (!regs.days) regs.days = [];

// save selected days
regs.days.push(...currentDayPassDays, ...currentVisitorDays);

// fest blocks everything else
if (currentPassType === "Fest Pass") {
  regs.fest = true;
}

saveRegistrations(regs);

  /* ➡️ REDIRECT TO PAYMENT PAGE */
  window.location.href = "upi-payment.html";
});























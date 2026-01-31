import { auth, initAuth } from "./auth.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

initAuth({
  requireAuth: true,
  redirectTo: "index.html",
  showDashboard: true
});


/* ---------- LOGOUT ---------- */
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

// 🌐 Toggle mobile menu
const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu");

// Toggle menu on click
menuToggle.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent closing instantly
  menu.classList.toggle("active");
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
    menu.classList.remove("active");
  }
});

// Close menu when clicking a link (mobile)
document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", () => {
    menu.classList.remove("active");
  });
});

// 🧭 Button Redirections
const registerBtn = document.getElementById("registerBtn");
const myAccBtn = document.getElementById("myAccBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    window.location.href = "registrationPravaah.html";
  });
}

if (myAccBtn) {
  myAccBtn.addEventListener("click", () => {
    alert("Feature Coming Soon! You can view your booking status here soon.");
  });
}

// ✨ Glow pulse effect for cards
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mouseenter", () => {
    card.style.boxShadow = "0 0 40px rgba(0,255,255,0.8)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.boxShadow = "0 0 20px rgba(0,255,255,0.3)";
  });
});

/* =====================================
   ACCOMMODATION LOGIC (NEW)
===================================== */

const PRICES = {
  single: {
    1: 10000,
    2: 20000,
    3: 3000,
    4: 4000
  },
  common: {
    1: 1,
    2: 2,
    3: 3,
    4: 4
  }
};


const IITBBS_DOMAIN = "@iitbbs.ac.in";

function isIITBBSUser() {
  return auth.currentUser?.email?.endsWith(IITBBS_DOMAIN);
}

let selectedGender = null;
let selectedRoom = null;
let selectedDays = [];
let participantsCount = 0;

const totalAmountEl = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");

/* ---------- IITBBS RULE ---------- */
onAuthStateChanged(auth, (user) => {
  if (user && isIITBBSUser()) {
    document.querySelector(".passes-box").innerHTML = `
      <div class="participant-card">
        <h3 style="color:#4cff88;text-align:center;">
          IIT Bhubaneswar students do not need accommodation.
        </h3>
      </div>
    `;
  }
});

/* ---------- SINGLE SELECT (Gender & Room) ---------- */
function setupSingleSelect(attr, setter) {
  document.querySelectorAll(`[${attr}]`).forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(`[${attr}]`).forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      setter(card.dataset[attr.replace("data-","")]);
      calculateTotal();
    });
  });
}

setupSingleSelect("data-gender", (val) => selectedGender = val);
setupSingleSelect("data-room", (val) => selectedRoom = val);

/* ---------- MULTI SELECT (Days) ---------- */
document.querySelectorAll("[data-day]").forEach(card => {
  card.addEventListener("click", () => {
    const d = card.dataset.day;

    if (selectedDays.includes(d)) {
      selectedDays = selectedDays.filter(x => x !== d);
      card.classList.remove("selected");
    } else {
      selectedDays.push(d);
      card.classList.add("selected");
    }

    calculateTotal();
  });
});

/* ---------- PARTICIPANTS ---------- */
const numInput = document.getElementById("numParticipants");
const incBtn = document.getElementById("incPart");
const decBtn = document.getElementById("decPart");
const participantsContainer = document.getElementById("participantsContainer");

incBtn.addEventListener("click", () => {
  let v = +numInput.value || 0;
  if (v < 10) v++;
  numInput.value = v;
  buildParticipantForms(v);
});

decBtn.addEventListener("click", () => {
  let v = +numInput.value || 0;
  if (v > 0) v--;
  numInput.value = v;
  buildParticipantForms(v);
});

function buildParticipantForms(count) {
  participantsCount = count;
  participantsContainer.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "participant-card";
    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input class="pname" placeholder="Full Name">
      <input class="pemail" placeholder="Email">
      <input class="pphone" placeholder="Phone">
      <input class="pcollege" placeholder="College">
    `;
    participantsContainer.appendChild(div);
  }

  calculateTotal();
}

/* ---------- TOTAL CALCULATION ---------- */
function calculateTotal() {
  if (!selectedRoom || selectedDays.length === 0) {
    totalAmountEl.textContent = "Total: ₹0";
    return;
  }

  const dayCount = selectedDays.length;
  const priceForRoom = PRICES[selectedRoom][dayCount] || 0;
  const total = priceForRoom * participantsCount;

  totalAmountEl.textContent = `Total: ₹${total}`;
}


/* ---------- PAY BUTTON ---------- */
payBtn.addEventListener("click", () => {
  if (!selectedGender || !selectedRoom || selectedDays.length === 0) {
    alert("Please select gender, room type and days.");
    return;
  }

  if (participantsCount <= 0) {
    alert("Please add at least 1 participant.");
    return;
  }

  const cards = document.querySelectorAll(".participant-card");
  const participants = [];

  cards.forEach(c => {
    const name = c.querySelector(".pname")?.value.trim();
    const email = c.querySelector(".pemail")?.value.trim();
    const phone = c.querySelector(".pphone")?.value.trim();
    const college = c.querySelector(".pcollege")?.value.trim();

    if (!name || !email || !phone || !college) {
      alert("Fill all participant fields.");
      throw new Error("Missing fields");
    }

    participants.push({ name, email, phone, college });
  });

  const session = {
    gender: selectedGender,
    roomType: selectedRoom,
    days: selectedDays,
    participants,
    total: totalAmountEl.textContent,
    registeredEmail: auth.currentUser.email
  };

  localStorage.setItem("accommodation_payment", JSON.stringify(session));
  window.location.href = "accommodation_payment.html";
});




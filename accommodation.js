import { auth, initAuth } from "./auth.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

initAuth({
  requireAuth: true,
  redirectTo: "index.html",
  showDashboard: true
});

const roomGrid = document.getElementById("roomGrid");
const dayGrid = document.getElementById("dayGrid");
const roomTitle = document.getElementById("roomTitle");
const dayTitle = document.getElementById("dayTitle");

roomGrid.style.display = "none";
dayGrid.style.display = "none";
roomTitle.style.display = "none";
dayTitle.style.display = "none";


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
    1: 1,
    2: 2,
    3: 3,
    4: 4
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


setupSingleSelect("data-gender", (val) => {
  selectedGender = val;

  roomGrid.style.display = "grid";
  roomTitle.style.display = "block";

  dayGrid.style.display = "none";
  dayTitle.style.display = "none";

  selectedRoom = null;
  selectedDays = [];
});


setupSingleSelect("data-room", (val) => {
  selectedRoom = val;

  dayGrid.style.display = "grid";
  dayTitle.style.display = "block";
});


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

const participantsContainer = document.getElementById("participantsContainer");

function buildSingleParticipantForm() {
  participantsContainer.innerHTML = `
    <div class="participant-card">
      <h4>Student Details</h4>
      <input class="pname" placeholder="Full Name">
      <input class="pemail" placeholder="Email">
      <input class="pphone" placeholder="Phone">
      <input class="pcollege" placeholder="College">
    </div>
  `;
}
// ✅ Autofill like pass.js
onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const card = document.querySelector(".participant-card");
  if (!card) return;

  const nameInput = card.querySelector(".pname");
  const emailInput = card.querySelector(".pemail");
  const phoneInput = card.querySelector(".pphone");
  const collegeInput = card.querySelector(".pcollege");

  // Autofill email from Firebase
  if (emailInput) emailInput.value = user.email || "";

  // Autofill from localStorage (if saved earlier like pass.js)
  const profile = JSON.parse(localStorage.getItem("user_profile") || "{}");

  if (nameInput && profile.name) nameInput.value = profile.name;
  if (phoneInput && profile.phone) phoneInput.value = profile.phone;
  if (collegeInput && profile.college) collegeInput.value = profile.college;
});

buildSingleParticipantForm();


/* ---------- TOTAL CALCULATION ---------- */
function calculateTotal() {
  if (!selectedRoom || selectedDays.length === 0) {
    totalAmountEl.textContent = "Total: ₹0";
    return;
  }

  const dayCount = selectedDays.length;
  const priceForRoom = PRICES[selectedRoom][dayCount] || 0;
  totalAmountEl.textContent = `Total: ₹${priceForRoom}`;
}


/* ---------- PAY BUTTON ---------- */
payBtn.addEventListener("click", () => {
  if (!selectedGender || !selectedRoom || selectedDays.length === 0) {
    alert("Please select gender, room type and days.");
    return;
  }

  const card = document.querySelector(".participant-card");

const name = card.querySelector(".pname").value.trim();
const email = card.querySelector(".pemail").value.trim();
const phone = card.querySelector(".pphone").value.trim();
const college = card.querySelector(".pcollege").value.trim();

if (!name || !email || !phone || !college) {
  alert("Fill all fields.");
  return;
}

const participants = [{ name, email, phone, college }];

  const session = {
    gender: selectedGender,
    roomType: selectedRoom,
    days: selectedDays,
    participants,
    total: totalAmountEl.textContent,
    registeredEmail: auth.currentUser.email
  };

  localStorage.setItem("accommodation_payment", JSON.stringify(session));
  window.location.href = "upi-payment.html";
});










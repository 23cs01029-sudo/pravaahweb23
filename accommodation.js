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
    1: 1199,
    2: 1999,
    3: 2799,
    4: 3599
  },
  common: {
    1: 799,
    2: 1399,
    3: 1999,
    4: 2499
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
buildSingleParticipantForm();



// 🔁 PROFILE AUTOFILL (NAME → ALL DETAILS)
const profile = JSON.parse(localStorage.getItem("user_profile") || "{}");

const card = document.querySelector(".participant-card");
const nameInput = card.querySelector(".pname");
const emailInput = card.querySelector(".pemail");
const phoneInput = card.querySelector(".pphone");
const collegeInput = card.querySelector(".pcollege");

// When user types NAME → autofill other fields
nameInput.addEventListener("input", () => {
  if (!profile.name) return;

  if (nameInput.value.trim().toLowerCase() === profile.name.toLowerCase()) {
    emailInput.value   = profile.email   || "";
    phoneInput.value   = profile.phone   || "";
    collegeInput.value = profile.college || "";
  }
});

// Save profile whenever user edits
[nameInput, emailInput, phoneInput, collegeInput].forEach(input => {
  input.addEventListener("input", () => {
    localStorage.setItem("user_profile", JSON.stringify({
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      college: collegeInput.value.trim()
    }));
  });
});



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

  const dayCount = selectedDays.length;
  const priceForRoom = PRICES[selectedRoom][dayCount] || 0;

  const session = {
    sessionId: "ACC_" + Date.now(),
    passType: "Accommodation",
    totalAmount: priceForRoom,   // ✅ NUMBER ONLY
    gender: selectedGender,
    roomType: selectedRoom,
    days: selectedDays,
    participants,
    registeredEmail: auth.currentUser.email
  };

  // ✅ MUST match UPI page
  localStorage.setItem("pravaah_payment", JSON.stringify(session));

  window.location.href = "upi-payment.html";
});
;
















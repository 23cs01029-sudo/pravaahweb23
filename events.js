/* ============================================================
   PRAVAAH — EVENTS PAGE SCRIPT (Optimized + Theme Consistent)
   Handles:
   ✔ Mobile Navbar Toggle
   ✔ Category Switching (Tech / Cultural / Workshop)
============================================================ */
import { auth } from "./auth.js";
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// ------------------------------------------------------------
// 🌐 MOBILE NAVBAR TOGGLE
// ------------------------------------------------------------
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  // Open / Close menu
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  // Close on clicking a link
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => menu.classList.remove("active"));
  });
}


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
// ------------------------------------------------------------
// 🎭 EVENT CATEGORY CONTROLS
// ------------------------------------------------------------
const techBtn = document.getElementById("techBtn");
const cultBtn = document.getElementById("cultBtn");
const workBtn = document.getElementById("workBtn");

const techSection = document.querySelector(".tech-events");
const cultSection = document.querySelector(".cult-events");
const workSection = document.querySelector(".work-events");


// Reset all tabs + buttons
function resetTabs() {
  techSection.classList.remove("active");
  cultSection.classList.remove("active");
  workSection.classList.remove("active");

  techBtn.classList.remove("active");
  cultBtn.classList.remove("active");
  workBtn.classList.remove("active");
}


// ------------------------------------------------------------
// 🧠 Technopreneurship
// ------------------------------------------------------------
techBtn.addEventListener("click", () => {
  resetTabs();
  techSection.classList.add("active");
  techBtn.classList.add("active");

  // subtle animation
  techSection.style.animation = "fadeIn 0.45s ease";
});


// ------------------------------------------------------------
// 🎭 Cultural
// ------------------------------------------------------------
cultBtn.addEventListener("click", () => {
  resetTabs();
  cultSection.classList.add("active");
  cultBtn.classList.add("active");

  cultSection.style.animation = "fadeIn 0.45s ease";
});


// ------------------------------------------------------------
// 🛠 Workshops
// ------------------------------------------------------------
workBtn.addEventListener("click", () => {
  resetTabs();
  workSection.classList.add("active");
  workBtn.classList.add("active");

  workSection.style.animation = "fadeIn 0.45s ease";
});



// ------------------------------------------------------------
// ✨ Small Fade Animation (auto used above)
// ------------------------------------------------------------
document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  </style>`
);



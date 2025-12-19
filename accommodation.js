import { auth } from "./auth.js";
import { signOut } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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


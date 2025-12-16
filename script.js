/* ============================================================
   PRAVAAH — FINAL UPDATED script.js (Optimized & Clean)
============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------- FIREBASE CONFIG ---------------------- */
  const firebaseConfig = {
    apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
    authDomain: "pravaah-55b1d.firebaseapp.com",
    projectId: "pravaah-55b1d",
    storageBucket: "pravaah-55b1d.appspot.com",
    messagingSenderId: "287687647267",
    appId: "1:287687647267:web:7aecd603ee202779b89196"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);


  /* ---------------------- LOGOUT ---------------------- */
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  const handleLogout = () => {
    signOut(auth)
      .then(() => (window.location.href = "login.html"))
      .catch(err => alert("Logout Error: " + err.message));
  };

  logoutDesktop?.addEventListener("click", handleLogout);
  logoutMobile?.addEventListener("click", handleLogout);



  /* ---------------------- CALENDAR + FEED ---------------------- */

  const monthYear = document.getElementById("monthYear");
  const calendar = document.getElementById("calendar");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const feedList = document.getElementById("feedList");

  let currentDate = new Date();

  const feedsByDate = {
    "2025-12-11": [
      { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
       { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" },
      { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
    ]
  };

  const defaultFeed = [
    { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
  ];



  /* ---------------------- FEED RENDER ---------------------- */
  function renderFeed(dateKey) {
    if (!feedList) return;

    feedList.classList.add("fade-out");

    setTimeout(() => {
      feedList.innerHTML = "";
      const data = feedsByDate[dateKey] || defaultFeed;

      data.forEach(feed => {
        const item = document.createElement("div");
        item.className = "feed-item";

        item.innerHTML = `
          <img src="${feed.img}" alt="${feed.name}">
          <div class="feed-details">
            <h4>${feed.name}</h4>
            <p>${feed.text}</p>
          </div>
          <div class="feed-time">${feed.time}</div>
        `;

        feedList.appendChild(item);
      });

      feedList.classList.remove("fade-out");
      feedList.classList.add("fade-in");

      setTimeout(() => feedList.classList.remove("fade-in"), 450);
    }, 250);
  }



  /* ---------------------- CALENDAR RENDER ---------------------- */

  function renderCalendar(date, transition = false) {
    if (!calendar) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    if (transition) calendar.classList.add("fade-out");

    setTimeout(() => {
      monthYear.textContent =
        `${date.toLocaleString("default", { month: "long" })} ${year}`;

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      calendar.innerHTML = "";

      for (let i = 0; i < firstDay; i++) {
        calendar.appendChild(document.createElement("div"));
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement("div");
        day.classList.add("day");
        day.textContent = i;

        const today = new Date();
        if (
          i === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear()
        ) {
          day.classList.add("today");
        }

        day.addEventListener("click", () => {
          document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
          day.classList.add("selected");

          const key =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
          renderFeed(key);
        });

        calendar.appendChild(day);
      }

      if (transition) {
        calendar.classList.remove("fade-out");
        calendar.classList.add("fade-in");
        setTimeout(() => calendar.classList.remove("fade-in"), 450);
      }
    }, transition ? 250 : 0);
  }


  prevMonth?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate, true);
  });

  nextMonth?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate, true);
  });

  renderCalendar(currentDate);

  renderFeed(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
  );



  /* ---------------------- VIDEO SWITCH ---------------------- */

  const mainVideo = document.getElementById("mainVideo");
  const aftermovieBtn = document.getElementById("aftermovieBtn");
  const themeBtn = document.getElementById("themeBtn");

  aftermovieBtn?.addEventListener("click", () => {
    mainVideo.src = "aftermovie.mp4";
    aftermovieBtn.classList.add("active");
    themeBtn.classList.remove("active");
  });

  themeBtn?.addEventListener("click", () => {
    mainVideo.src = "themevideo.mp4";
    themeBtn.classList.add("active");
    aftermovieBtn.classList.remove("active");
  });



  /* ---------------------- MOBILE NAV MENU ---------------------- */

  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
        menu.classList.remove("active");
      }
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => menu.classList.remove("active"));
    });
  }



  /* ===========================================================
     🔵 LIGHTBOX SYSTEM — FIXED & FINAL
  =========================================================== */

  /* Get ORIGINAL slides only (no duplicates) */
  const slides = document.querySelectorAll(".slide");

  let galleryImages = Array.from(slides).map((slide, index) => {
    const img = slide.querySelector("img");

    return {
      src: img.src,
      title: slide.getAttribute("data-title"),
      desc: "Experience the Chronicles of Time — PRAVAAH 2K25.",
      index
    };
  });

  let currentIndex = 0;


  /* ---------- Inject Lightbox HTML ---------- */
  const lightbox = document.getElementById("lightbox");

  lightbox.innerHTML = `
    <div class="lightbox-top">
      <span class="close-lightbox"><i class="fa-solid fa-xmark"></i></span>
      <a id="downloadIcon" class="download-icon" download>
        <i class="fa-solid fa-download"></i>
      </a>
    </div>

    <div class="lb-arrow left"><i class="fa-solid fa-chevron-left"></i></div>

    <img id="lightboxImg">

    <div class="lb-arrow right"><i class="fa-solid fa-chevron-right"></i></div>

    <div class="lightbox-info">
      <h3 id="lightboxTitle"></h3>
      <p id="lightboxDesc"></p>
    </div>
  `;

  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");
  const lbDesc = document.getElementById("lightboxDesc");
  const downloadIcon = document.getElementById("downloadIcon");

  const closeBtn = document.querySelector(".close-lightbox");
  const leftArrow = document.querySelector(".lb-arrow.left");
  const rightArrow = document.querySelector(".lb-arrow.right");



  /* ---------- FUNCTIONS ---------- */

  function showSlide(index) {
    lbImg.style.opacity = 0;

    setTimeout(() => {
      const item = galleryImages[index];

      lbImg.src = item.src;
      lbTitle.textContent = item.title;
      lbDesc.textContent = item.desc;

      downloadIcon.href = item.src;
      downloadIcon.setAttribute("download", item.title.replace(/\s+/g, "_"));

      lbImg.style.opacity = 1;
    }, 200);
  }

  function openLightbox(index) {
    currentIndex = index;
    showSlide(index);
    lightbox.classList.remove("hidden");
  }


  /* ---------- EVENT LISTENERS ---------- */

  closeBtn.addEventListener("click", () => lightbox.classList.add("hidden"));

  document.querySelectorAll(".zoom-icon").forEach((icon, i) => {
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(i);  // FIXED INDEXING
    });
  });

  leftArrow.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    showSlide(currentIndex);
  });

  rightArrow.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    showSlide(currentIndex);
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.add("hidden");
  });


  /* ---------- SWIPE SUPPORT ---------- */

  let startX = 0;

  lightbox.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].clientX;
  });

  lightbox.addEventListener("touchend", (e) => {
    let endX = e.changedTouches[0].clientX;

    if (startX - endX > 60) rightArrow.click();
    if (endX - startX > 60) leftArrow.click();
  });
  /* ===========================================================
     🔐 DASHBOARD VISIBILITY — ADMINS ONLY
  =========================================================== */

  const DASHBOARD_API =
    "https://script.google.com/macros/s/AKfycbxTtdt1HmTIP0i5WOeXMLRWLKA1k4RpD153EmgU-Ow6CPRGOISzjOVLplKFDm-gUaggmg/exec";

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      const res = await fetch(
        `${DASHBOARD_API}?type=role&email=${encodeURIComponent(user.email)}`
      );
      const roleObj = await res.json();

      // ✅ SHOW DASHBOARD ONLY FOR ADMINS+
      if (["Admin", "SuperAdmin", "SuperAccount"].includes(roleObj.role)) {
        document.getElementById("dashboardNav")
          ?.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Dashboard role check failed", err);
    }
  });

});




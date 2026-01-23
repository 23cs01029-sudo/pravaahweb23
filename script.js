document.addEventListener("DOMContentLoaded", () => {

  const monthYear = document.getElementById("monthYear");
  const calendar = document.getElementById("calendar");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const feedList = document.getElementById("feedList");

  let currentDate = new Date();

  const feedsByDate = { 
     "2026-01-27": [
      { img: "Pravaah.JPG", name: "9days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-28": [
      { img: "Pravaah.JPG", name: "8days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-29": [
      { img: "Pravaah.JPG", name: "7days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-30": [
      { img: "Pravaah.JPG", name: "6days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-31": [
      { img: "Pravaah.JPG", name: "5days to go", text: "Somethings cooking", time: "soon" },
    ],
    "2026-02-01": [
      { img: "Pravaah.JPG", name: "4days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-02-02": [
      { img: "Pravaah.JPG", name: "3days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-02-03": [
      { img: "Pravaah.JPG", name: "2days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-02-04": [
      { img: "Pravaah.JPG", name: "1day to go", text: "Somethings cooking", time: "soon" },
    ],
    "2026-02-05": [
      { img: "Openingcermony.JPG", name: "Pravaah", text: "Opening Cermony", time: "6:30 PM" },
    ],
  "2026-02-06": [
  { img: "guesttalk1.JPG", name: "Guest Talk – 1", text: "", time: "9:00 AM" },
  { img: "fashionshow_gallery.JPG", name: "Fashion Show", text: "", time: "10:00 AM" },
  { img: "hackathon.JPG", name: "Data Science Hackathon", text: "", time: "11:00 AM" },
  { img: "quiz.JPG", name: "General Quiz", text: "", time: "12:00 PM" },

  { img: "Marcatus.JPG", name: "Marcatus – Round 2", text: "", time: "1:00 PM" },
  { img: "informal night.JPG", name: "Informal Night", text: "", time: "1:00 PM" },

  { img: "Marcatus.JPG", name: "Marcatus – Round 1", text: "", time: "2:00 PM" },
  { img: "startupExpo.JPG", name: "Startup Expo", text: "", time: "2:00 PM" },
  { img: "facepainting.JPG", name: "Face Painting", text: "", time: "2:00 PM" },

  { img: "startupExpo.JPG", name: "Startup Expo", text: "", time: "3:00 PM" },
  { img: "robo soccor.JPG", name: "Robo Soccer", text: "", time: "3:00 PM" },
  { img: "shortfilm.JPG", name: "51-Hour Short Film – Start", text: "", time: "3:00 PM" },

  { img: "robo soccor.JPG", name: "Robo Soccer", text: "", time: "4:00 PM" },
  { img: "abhinay.JPG", name: "Abhinay", text: "", time: "5:00 PM" },
  { img: "abhinay.JPG", name: "Abhinay", text: "", time: "6:00 PM" }
],



  // ================= DAY 2 (Feb 7) =================
"2026-02-07": [
  { img: "guesttalk2.JPG", name: "Guest Talk – 2", text: "", time: "8:00 AM" },
  { img: "shortfilm.JPG", name: "51-Hour Short Film", text: "", time: "9:00 AM" },
  { img: "webhackathon.JPG", name: "Web Hackathon", text: "", time: "10:00 AM" },

  { img: "sciencequiz.JPG", name: "Science & Technology Quiz", text: "", time: "11:00 AM" },
  { img: "bplan.JPG", name: "B-Plan", text: "", time: "11:00 AM" },

  { img: "enigma.JPG", name: "Enigma – Round 1", text: "", time: "12:00 PM" },
  { img: "enigma.JPG", name: "Enigma – Round 2", text: "", time: "1:00 PM" },

  { img: "Innovation Expo_gallery.JPG", name: "Innovation Expo", text: "", time: "2:00 PM" },
  { img: "Innovation Expo_gallery.JPG", name: "Innovation Expo", text: "", time: "3:00 PM" },

  { img: "blastoff.JPG", name: "Blast Off", text: "", time: "4:00 PM" },
  { img: "RoboRace.JPG", name: "Robo Race", text: "", time: "4:00 PM" },

  { img: "monoact.JPG", name: "Monoact", text: "", time: "5:00 PM" },
  { img: "Tamasha_gallery.JPG", name: "Tamasha", text: "", time: "6:00 PM" },
  { img: "comedy.JPG", name: "Comedy Night", text: "", time: "7:00 PM" }
],



  // ================= DAY 3 (Feb 8) =================
 "2026-02-08": [
  { img: "guesttalk3.JPG", name: "Guest Talk – 3", text: "", time: "8:00 AM" },
  { img: "shortfilm.JPG", name: "51-Hour Short Film", text: "", time: "9:00 AM" },
  { img: "edusphere.JPG", name: "Edusphere", text: "", time: "10:00 AM" },

  { img: "iplauction.JPG", name: "IPL Auction – Round 1", text: "", time: "11:00 AM" },
  { img: "iplauction.JPG", name: "IPL Auction – Round 2", text: "", time: "12:00 PM" },

  { img: "solodance.JPG", name: "Solo Dance", text: "", time: "1:00 PM" },
  { img: "groupdance.JPG", name: "Group Dance", text: "", time: "2:00 PM" },
  { img: "Trekkon_gallery.JPG", name: "Trekkon", text: "", time: "3:00 PM" },
  { img: "StreetDanceBattle_gallery.JPG", name: "Street Battle", text: "", time: "4:00 PM" },

  { img: "starnight.JPG", name: "Star Night", text: "", time: "7:00 PM" },
  { img: "djnight.JPG", name: "DJ Night", text: "", time: "7:00 PM" }
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
    <div class="feed-row">
      <h4>${feed.name}</h4>
      <span class="event-time">
        ${feed.time}
      </span>
    </div>

    <div class="feed-row secondary">
      <p>${feed.text}</p>
      <a
        href="${feed.locationLink || 'https://maps.google.com/?q=IIT+Bhubaneswar'}"
        target="_blank"
        rel="noopener noreferrer"
        class="event-location"
        title="View Location"
      >
        <i class="fa-solid fa-location-dot"></i>
      </a>
    </div>
  </div>
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
});












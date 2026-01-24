document.addEventListener("DOMContentLoaded", () => {

  const monthYear = document.getElementById("monthYear");
  const calendar = document.getElementById("calendar");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const feedList = document.getElementById("feedList");

  let currentDate = new Date();

  const feedsByDate = { 
     "2026-01-27": [
      { img: "pravah-logo.png", name: "9 days to go", text: "Somethings cooking", time: "soon"  },
    ],
     "2026-01-28": [
      { img: "Pravaah logo.png", name: "8 days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-29": [
      { img: "Pravaah logo.png", name: "7 days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-30": [
      { img: "Pravaah logo.png", name: "6 days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-01-31": [
      { img: "Pravaah logo.png", name: "5 days to go", text: "Somethings cooking", time: "soon" },
    ],
    "2026-02-01": [
      { img: "Pravaah logo.png", name: "4 days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-02-02": [
      { img: "Pravaah logo.png", name: "3 days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-02-03": [
      { img: "Pravaah logo.png", name: "2 days to go", text: "Somethings cooking", time: "soon" },
    ],
     "2026-02-04": [
      { img: "Pravaah logo.png", name: "1 day to go", text: "Somethings cooking", time: "soon" },
    ],
    "2026-02-05": [
      { img: "Inaugural.jpg", name: "Pravaah", text: "Opening Cermony", time: "6:30 PM" ,locationLink:"https://maps.app.goo.gl/BDz4WQp2ZXHVktaR9"},
    ],
  "2026-02-06": [
  { img: "Guest Talk.JPG", name: "Guest Talk – 1", text: "Inspiring expert insights", time: "12:00 PM" ,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "fashionshow_gallery.jpg", name: "Fashion Show", text: "Style meets confidence", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/BDz4WQp2ZXHVktaR9" },
  { img: "ML HACKTHON.jpg", name: "Data Science Hackathon", text: "Code,Analyze,Innovate.", time: "9:00 AM" ,locationLink:"https://maps.app.goo.gl/n6YXxLQmicNHihqi7"},
  { img: "Film Quiz_events.JPG", name: "General Quiz", text: "Test your knowledge", time: "9:00 AM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },

  { img: "Marcatus.JPG", name: "Marcatus – Round 1", text: "Business minds battle", time: "10:00 PM" ,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "informal night.JPG", name: "Informal Night", text: "Fun without filters", time: "6:00 PM",locationLink:"https://maps.app.goo.gl/jDQyDv2pJuNpothj7" },

  { img: "Marcatus.JPG", name: "Marcatus – Round 2", text: "Business minds battle", time: "2:30 PM" ,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28"},
  { img: "startup expo event.jpg", name: "Startup Expo", text: "Ideas meet investors", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "face painting events.webp", name: "Face Painting", text: "Colors come alive", time: "6:00 PM" ,locationLink:"https://maps.app.goo.gl/jDQyDv2pJuNpothj7" },

  
  { img: "robo soccor.JPG", name: "Robo Soccer", text: "Robots,Goals,Glory", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/jDQyDv2pJuNpothj7" },
  { img: "51hr flimmaking events.avif", name: "51-Hour Short Film – Start", text: "Create,Shoot,Edit.", time: "6:00 PM" },

  
  { img: "abhinay event.jpeg", name: "Abhinay", text: "Act,Express,Perform.", time: "2:00 PM" ,locationLink:"https://maps.app.goo.gl/h175EDFX6i3GMWbt9" }
  
],



  // ================= DAY 2 (Feb 7) =================
"2026-02-07": [
  { img: "Guest Talk.JPG", name: "Guest Talk – 2", text: "Act,Express,Perform.", time: "12:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "51hr flimmaking events.avif", name: "51-Hour Short Film", text: "Create,Shoot,Edit.", time: "8:00 AM" },
  { img: "ML HACKTHON.jpg", name: "Web Hackathon", text: "Build,Deploy,Innovate", time: "8:00 AM",locationLink:"https://maps.app.goo.gl/n6YXxLQmicNHihqi7" },

  { img: "data sceince event.jpg", name: "Science & Technology Quiz", text: "Where minds compete", time: "9:00 AM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "B plan event.jpg", name: "B-Plan", text: "Pitch your startup", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },

  { img: "Enigma_gallery.JPG", name: "Enigma – Round 1", text: "Crack the mystery", time: "10:00 AM" ,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28"},
  { img: "Enigma_events.JPG", name: "Enigma – Round 2", text: "Crack the mystery", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },

  { img: "Innovation Expo_gallery.JPG", name: "Innovation Expo", text: "Future on display", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  

  { img: "blastoff event.jpg", name: "Blast Off", text: "Ignite,Launch,Celebrate.", time: "10:00 AM",locationLink:"https://maps.app.goo.gl/RUXkuHvS72VWrdku5" },
  { img: "RoboRace.jpg", name: "Robo Race", text: "Speed,Tech,Thrill.", time: "2:00 PM",locationLink:"https://maps.app.goo.gl/jDQyDv2pJuNpothj7"  },

  { img: "monoct events.jpeg", name: "Monoact", text: "Solo story performance",time: "8:00 AM",locationLink:"https://maps.app.goo.gl/Kj77m4LAc68SfaXf8" },
  { img: "Tamasha_gallery.jpg", name: "Tamasha", text: "Drama and entertainment", time: "3:00 PM" ,locationLink:"https://maps.app.goo.gl/Kj77m4LAc68SfaXf8"},
  { img: "Pravaah logo.png", name: "Comedy Night", text: "Laughs all-around", time: "6:30 PM" ,locationLink:"https://maps.app.goo.gl/jDQyDv2pJuNpothj7" }
],



  // ================= DAY 3 (Feb 8) =================
 "2026-02-08": [
  { img: "Guest Talk.JPG", name: "Guest Talk – 3", text: "Inspiring expert insights", time: "12:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "51hr flimmaking events.avif", name: "51-Hour Short Film", text: "Create,Shoot,Edit.", time: "8:00 AM" },
  { img: "edusphere.png", name: "Edusphere", text: "Learn,Explore,Grow.", time: "10:00 AM",,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },

  { img: "ipl quiz_events (1).png", name: "IPL Auction – Round 1", text: "Bid,Strategize,Win.", time: "10:00 AM" ,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28"},
  { img: "ipl quiz_events (1).png", name: "IPL Auction – Round 2", text: "Bid,Strategize,Win.", time: "2:00 PM" ,locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28"},

  { img: "SoloDance_events.jpg", name: "Solo Dance", text: "Express through movement", time: "9:30 AM" ,locationLink:"https://maps.app.goo.gl/nxKumvFAEe4KybS26"},
  { img: "group Dance_events.JPG", name: "Group Dance", text: "Unity in motion", time: "1:30 PM",locationLink:"https://maps.app.goo.gl/nxKumvFAEe4KybS26" },
  { img: "trekkon event.jpg", name: "Trekkon", text: "Robots on track", time: "10:00 PM",locationLink:"https://maps.app.goo.gl/6xiczMEfwDUEBZQ28" },
  { img: "StreetDanceBattle_gallery.jpg", name: "Street Battle", text: "Dance,Clash,Dominate.", time: "4:00 PM" ,locationLink:"https://maps.app.goo.gl/Kj77m4LAc68SfaXf8"},

  { img: "StarNight_events.JPG", name: "Star Night", text: "Stars,Lights,Vibes.", time: "7:00 PM" ,locationLink:"https://maps.app.goo.gl/6mLvvmnVb1UTvo2G7"},
  { img: "Screenshot 2026-01-24 010231.png", name: "DJ Night", text: "Beats,Bass,Blast.", time: "7:00 PM",locationLink:"https://maps.app.goo.gl/6mLvvmnVb1UTvo2G7" }
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
        // Highlight fest days: 5, 6, 7, 8
if ([5, 6, 7, 8].includes(i) && month === 1 && year === 2026) {
  day.classList.add("fest-day");
}

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

/* ---------------------- VIDEO SWITCH (YOUTUBE) ---------------------- */

const mainVideo = document.getElementById("mainVideo");
const aftermovieBtn = document.getElementById("aftermovieBtn");
const themeBtn = document.getElementById("themeBtn");

const AFTERMOVIE_URL =
  "https://www.youtube.com/embed/9Uo26U4lmC8?si=tuywewRfDIoW_soV";


const THEME_URL =
  "https://www.youtube.com/embed/0iiRlChfIRo?si=5o8mb4mykMLxVvBA";


aftermovieBtn?.addEventListener("click", () => {
  mainVideo.src = AFTERMOVIE_URL;
  aftermovieBtn.classList.add("active");
  themeBtn.classList.remove("active");
});

themeBtn?.addEventListener("click", () => {
  mainVideo.src = THEME_URL;
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
/* =========================================================
   ⏸️ STOP YOUTUBE VIDEO WHEN TAB / PAGE IS NOT VISIBLE
   ========================================================= */

const iframe = document.getElementById("mainVideo");

function stopYouTubeVideo() {
  if (!iframe) return;

  // Reload iframe without autoplay (stops playback)
  const src = iframe.src;
  iframe.src = src.replace("&autoplay=1", "");
}

// When user switches tab
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopYouTubeVideo();
  }
});

// When user switches browser / minimizes window
window.addEventListener("blur", () => {
  stopYouTubeVideo();
});

// When user leaves the page
window.addEventListener("beforeunload", () => {
  stopYouTubeVideo();
});






























document.addEventListener("DOMContentLoaded", () => {

  /* ===================== CALENDAR + FEED ===================== */

  const monthYear = document.getElementById("monthYear");
  const calendar = document.getElementById("calendar");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const feedList = document.getElementById("feedList");

  let currentDate = new Date();

  const feedsByDate = {
    "2025-12-11": Array(11).fill({
      img: "DSC09133.JPG",
      name: "Pravaah",
      text: "2nd Edition",
      time: "11:59"
    })
  };

  const defaultFeed = [
    { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
  ];

  function renderFeed(dateKey) {
    if (!feedList) return;

    feedList.innerHTML = "";
    const data = feedsByDate[dateKey] || defaultFeed;

    data.forEach(feed => {
      const item = document.createElement("div");
      item.className = "feed-item";
      item.innerHTML = `
        <img src="${feed.img}">
        <div class="feed-details">
          <h4>${feed.name}</h4>
          <p>${feed.text}</p>
        </div>
        <div class="feed-time">${feed.time}</div>
      `;
      feedList.appendChild(item);
    });
  }

  function renderCalendar(date) {
    if (!calendar) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    monthYear.textContent =
      `${date.toLocaleString("default", { month: "long" })} ${year}`;

    calendar.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      calendar.appendChild(document.createElement("div"));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const day = document.createElement("div");
      day.className = "day";
      day.textContent = i;

      day.addEventListener("click", () => {
        document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
        day.classList.add("selected");

        const key =
          `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        renderFeed(key);
      });

      calendar.appendChild(day);
    }
  }

  prevMonth?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  nextMonth?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  renderCalendar(currentDate);
  renderFeed(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
  );

  /* ===================== VIDEO SWITCH ===================== */

  const mainVideo = document.getElementById("mainVideo");
  document.getElementById("aftermovieBtn")?.addEventListener("click", () => {
    mainVideo.src = "aftermovie.mp4";
  });
  document.getElementById("themeBtn")?.addEventListener("click", () => {
    mainVideo.src = "themevideo.mp4";
  });

  /* ===================== MOBILE MENU ===================== */

  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  menuToggle?.addEventListener("click", e => {
    e.stopPropagation();
    menu.classList.toggle("active");
  });

  document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  /* ===================== HIGHLIGHTS SLIDER ===================== */

  const track = document.querySelector(".slider-track");
  if (!track) return;

  const originalSlides = Array.from(track.children);
  originalSlides.forEach(slide => {
    const clone = slide.cloneNode(true);
    clone.classList.add("clone");
    track.appendChild(clone);
  });

  let totalWidth = 0;
  originalSlides.forEach(slide => {
    totalWidth += slide.offsetWidth + 30;
  });

  track.style.setProperty("--distance", `-${totalWidth}px`);
  track.style.setProperty("--duration", `${totalWidth / 100}s`);

  /* ===================== LIGHTBOX ===================== */

  const slides = document.querySelectorAll(".slide:not(.clone)");

  const galleryImages = Array.from(slides).map((slide, index) => {
    slide.dataset.index = index;
    return {
      src: slide.querySelector("img").src,
      title: slide.dataset.title,
      desc: slide.dataset.desc
    };
  });

  let currentIndex = 0;

  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");
  const lbDesc = document.getElementById("lightboxDesc");
  const closeBtn = document.querySelector(".close-lightbox");
  const leftArrow = document.querySelector(".lb-arrow.left");
  const rightArrow = document.querySelector(".lb-arrow.right");

  function showSlide(index) {
    if (!galleryImages[index]) return;
    lbImg.src = galleryImages[index].src;
    lbTitle.textContent = galleryImages[index].title;
    lbDesc.textContent = galleryImages[index].desc;
    lightbox.classList.remove("hidden");
  }

  function openLightbox(index) {
    currentIndex = index;
    showSlide(index);
  }

  document.querySelectorAll(".slide:not(.clone) .zoom-icon").forEach(icon => {
    icon.addEventListener("click", e => {
      e.stopPropagation();
      openLightbox(Number(icon.closest(".slide").dataset.index));
    });
  });

  closeBtn.addEventListener("click", () => lightbox.classList.add("hidden"));

  leftArrow.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    showSlide(currentIndex);
  });

  rightArrow.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    showSlide(currentIndex);
  });

  /* ===================== SWIPE SUPPORT ===================== */

  let startX = 0;
  lightbox.addEventListener("touchstart", e => {
    startX = e.changedTouches[0].clientX;
  });

  lightbox.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 60) rightArrow.click();
    if (endX - startX > 60) leftArrow.click();
  });

});

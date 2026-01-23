// 🌌 PRAVAAH — Gallery JavaScript
// FINAL | Grid Gallery + Advanced Lightbox (Clean & Stable)

document.addEventListener("DOMContentLoaded", () => {

  /* ===========================================================
     📸 GALLERY DATA (FROM GRID)
  =========================================================== */

  const galleryImages = Array.from(galleryItems).map(item => {
  const img = item.querySelector("img");
  return {
    src: img.src,
    title: item.dataset.title || "PRAVAAH Moment",
    desc: item.dataset.desc || "Experience the Chronicles of Time — PRAVAAH 2K25."
  };
});

  let currentIndex = 0;

  /* ===========================================================
     🔍 LIGHTBOX ELEMENTS (FROM HTML)
  =========================================================== */

  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");
  const lbDesc = document.getElementById("lightboxDesc");
  const downloadIcon = document.getElementById("downloadIcon");

  const closeBtn = document.querySelector(".close-lightbox");
  const leftArrow = document.querySelector(".lb-arrow.left");
  const rightArrow = document.querySelector(".lb-arrow.right");

  if (!lightbox || !lbImg) return;

  /* ===========================================================
     🔄 CORE FUNCTIONS
  =========================================================== */

  function showImage(index) {
    const item = galleryImages[index];

    lbImg.src = item.src;
    lbTitle.textContent = item.title;
    lbDesc.textContent = item.desc;

    downloadIcon.href = item.src;
    downloadIcon.download =
      item.title.replace(/\s+/g, "_").toLowerCase() + ".jpg";
  }

  function openLightbox(index) {
    currentIndex = index;
    showImage(index);
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
  }

  /* ===========================================================
     🖱️ EVENTS — GRID
  =========================================================== */

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index));
  });

  /* ===========================================================
     🖱️ EVENTS — LIGHTBOX CONTROLS
  =========================================================== */

  closeBtn?.addEventListener("click", closeLightbox);

  leftArrow?.addEventListener("click", () => {
    currentIndex =
      (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    showImage(currentIndex);
  });

  rightArrow?.addEventListener("click", () => {
    currentIndex =
      (currentIndex + 1) % galleryImages.length;
    showImage(currentIndex);
  });

  // Click outside image closes lightbox
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ===========================================================
     📱 SWIPE SUPPORT (MOBILE)
  =========================================================== */

  let startX = 0;

  lightbox.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].clientX;
  });

  lightbox.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (diff > 60) rightArrow.click();
    if (diff < -60) leftArrow.click();
  });

});

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


/* ==========================================================
   PRAVAAH — Profile Management System (Firebase + Apps Script)
========================================================== */

import { auth } from "./auth.js";
import { onAuthStateChanged, signOut} from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const FRONTEND_BASE = "https://pravaahweb1.vercel.app";

/* ---------- Backend Script URL ---------- */
const scriptURL = "https://script.google.com/macros/s/AKfycbyjPQWJjyKc8En6Xz5jh9o1bcFOD8aHU3huf4jK1zEC0Hnwt52-g9x-GfEmBUPSDpsw9Q/exec";
/* ---------- DEBUG ---------- */
const DEBUG_PROFILE = true;
const log = (...args) => {
  if (DEBUG_PROFILE) console.log("[PROFILE]", ...args);
};
function onPhotoReady(img, transform) {
  img.classList.add("has-photo");

  // 🔒 force layout sync before transform
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (transform) {
        applyTransform(img, transform);
      } else {
        resetPhotoTransform(img);
      }
    });
  });
}

/* ---------- Toast ---------- */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

/* ---------- State ---------- */
let isEditing = false;
let originalProfile = { phone: "", college: "" };
let photoTransform = {
  x: 0,
  y: 0,
  zoom: 1,
  rotation: 0
};

function setEditMode(on, ctx) {
  isEditing = on;
  ctx.container.classList.toggle("is-edit", on);
  ctx.editActions.style.display = on ? "flex" : "none";

  ctx.uploadOptions.classList.toggle("hidden", !on);
  ctx.uploadOptions.style.display = on ? "flex" : "none";

  ctx.userPhoto.style.outline = on ? "2px dashed cyan" : "none";
  ctx.userPhoto.style.outlineOffset = "6px";
}
function loadUserPhoto(src, transform) {
  const img = document.getElementById("userPhoto");

  img.onload = null; // 🔒 clear old handlers
  img.onload = () => onPhotoReady(img, transform);
  img.src = src;
}

/* ---------- Save Profile ---------- */
async function saveProfileToSheet(profile) {
  const payload = JSON.stringify({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    college: profile.college || "",
     photo: profile.photo || "",
    transform: profile.transform || null
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(scriptURL, new Blob([payload], { type: "text/plain" }));
  } else {
    await fetch(scriptURL, {
      method: "POST",
       mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload
    });
  }
}

/* ---------- Field Text ---------- */
function ensureFieldSpan(input, id) {
  let span = document.getElementById(id);
  if (!span) {
    span = document.createElement("span");
    span.id = id;
    span.className = "field-text";
    input.insertAdjacentElement("afterend", span);
  }
  span.textContent = input.value.trim() || "-";
  return span;
}

/* ---------- Fetch Passes ---------- */
async function fetchUserPasses(email) {
  const res = await fetch(
    `${scriptURL}?type=passes&email=${encodeURIComponent(email)}`
  );
  return await res.json();
}


/* ---------- Render Passes + QR ---------- */
function renderPasses(passes, container, userEmail) {
  if (!Array.isArray(passes) || passes.length === 0) {
    container.innerHTML = `<div class="no-passes">No passes found</div>`;
    return;
  }

  container.innerHTML = "";

  passes.forEach((p, i) => {
    const passType   = p["Pass Type"] || p.passType || "-";
    const paymentId = p["Payment ID"] || p.paymentId || "-";
    const days      = p["Selected Days"] || p.accessDays || "-";
    const starnite  = p["Starnite"] || p.starnite || "NO";
    const events    = p["Events"] || p.events || "-";

    const qrId = `qr_${i}`;

    const card = document.createElement("div");
    card.className = "pass-item";
    card.innerHTML = `
  <div class="pass-details">
    <h3>${passType}</h3>
    <p><strong>Payment ID:</strong> ${paymentId}</p>
    <p><strong>Days:</strong> ${days}</p>
    <p><strong>StarNite:</strong> ${starnite}</p>
    <p><strong>Events:</strong> ${events}</p>
  </div>
  <div id="${qrId}" class="qr-box"></div>

`;

    container.appendChild(card);

    const qrBox = document.getElementById(qrId);
const qrUrl =
  `${FRONTEND_BASE}/public.html?paymentId=${encodeURIComponent(paymentId)}`;


new QRCode(qrBox, {
  text: qrUrl,
  width: 130,
  height: 130
});

/* HARDEN: no accidental URL exposure */
qrBox.querySelector("canvas")?.removeAttribute("title");

/* Click opens pass */
qrBox.style.cursor = "pointer";
qrBox.addEventListener("click", () => {
  window.open(qrUrl, "_blank", "noopener,noreferrer");
});



  });
}

/* ---------- Main ---------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  /* ================= ELEMENTS ================= */
  const container        = document.querySelector(".profile-container");
  const userPhoto        = document.getElementById("userPhoto");
  const uploadPhotoInput = document.getElementById("uploadPhoto");
  const uploadOptions    = document.getElementById("uploadOptions");
  const driveUploadBtn   = document.getElementById("driveUploadBtn");

  const userNameEl       = document.getElementById("userName");
  const userEmailEl      = document.getElementById("userEmail");
  const userPhoneInput  = document.getElementById("userPhone");
  const userCollegeInput= document.getElementById("userCollege");
  const passesList      = document.getElementById("passesList");

  const editActions     = document.getElementById("editActions");
  const logoutDesktop   = document.getElementById("logoutDesktop");
  const logoutMobile    = document.getElementById("logoutMobile");
  const cameraBtn       = document.getElementById("cameraBtn");

  /* ================= BASIC PREFILL ================= */
  userNameEl.textContent  = user.displayName || "PRAVAAH User";
  userEmailEl.textContent = user.email;

  // default avatar (NO onload here)
  if (!userPhoto.src || userPhoto.src.includes("default-avatar")) {
  userPhoto.src = "default-avatar.png";
}

  /* ================= LOAD PROFILE FROM SHEET ================= */
  let p = null;
  try {
    const res = await fetch(
      `${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`
    );
    p = await res.json();
  } catch (e) {
    console.error("Profile fetch failed", e);
  }

  /* ================= APPLY PROFILE DATA ================= */
  if (p?.email) {
    userPhoneInput.value   = p.phone   || "";
    userCollegeInput.value = p.college || "";

    photoTransform = p.transform || { x: 0, y: 0, zoom: 1, rotation: 0 };

    if (p.photo) {
  loadUserPhoto(p.photo, photoTransform);
}
else if (user.photoURL) {
  loadUserPhoto(user.photoURL, null);
}
  } 
  else if (user.photoURL) {
    loadUserPhoto(user.photoURL, null);
    userPhoto.src = user.photoURL;
  }

  /* ================= FIELD SPANS ================= */
  const phoneSpan   = ensureFieldSpan(userPhoneInput, "userPhoneText");
  const collegeSpan = ensureFieldSpan(userCollegeInput, "userCollegeText");

  originalProfile = {
    phone: userPhoneInput.value,
    college: userCollegeInput.value
  };

  /* ================= LOAD PASSES ================= */
  try {
    const passes = await fetchUserPasses(user.email);
    renderPasses(passes, passesList, user.email);
  } catch (e) {
    console.error("Pass fetch failed", e);
  }

  /* ================= EDIT TOGGLE ================= */
  document.getElementById("editPen").onclick = () => {
    originalProfile = {
      phone: userPhoneInput.value,
      college: userCollegeInput.value
    };
    setEditMode(!isEditing, {
      container,
      uploadOptions,
      userPhoto,
      editActions
    });
  };

  /* ================= SAVE ================= */
  document.getElementById("saveProfileBtn").onclick = async () => {
    await saveProfileToSheet({
      name: user.displayName,
      email: user.email,
      phone: userPhoneInput.value,
      college: userCollegeInput.value,
      photo: userPhoto.src,
      transform: photoTransform
    });

    phoneSpan.textContent   = userPhoneInput.value || "-";
    collegeSpan.textContent = userCollegeInput.value || "-";

    showToast("Profile updated!", "success");
    setEditMode(false, {
      container,
      uploadOptions,
      userPhoto,
      editActions
    });
  };

  /* ================= CANCEL ================= */
  document.getElementById("cancelEditBtn").onclick = () => {
    userPhoneInput.value   = originalProfile.phone;
    userCollegeInput.value = originalProfile.college;

    phoneSpan.textContent   = originalProfile.phone || "-";
    collegeSpan.textContent = originalProfile.college || "-";

    setEditMode(false, {
      container,
      uploadOptions,
      userPhoto,
      editActions
    });
  };

  /* ================= CAMERA BUTTON ================= */
  if (cameraBtn) {
    cameraBtn.onclick = () => {
      if (!isEditing) {
        showToast("Tap ✏️ to edit profile first", "info");
        return;
      }
      openPhotoEditorFromExisting();
    };
  }

  /* ================= DEVICE UPLOAD ================= */
  document.getElementById("deviceUploadBtn").onclick = () => {
    if (!isEditing) {
      showToast("Tap ✏️ to edit", "info");
      return;
    }
    uploadPhotoInput.click();
  };

  /* ================= DRIVE UPLOAD ================= */
  driveUploadBtn.onclick = async () => {
    if (!isEditing) {
      showToast("Tap ✏️ to edit", "info");
      return;
    }

    const link = prompt("Paste Google Drive image link");
    if (!link) return;

    const match = link.match(/(?:id=|\/d\/)([-\w]{25,})/);
    if (!match) {
      showToast("Invalid Google Drive link", "error");
      return;
    }

    const cdnUrl = `https://lh3.googleusercontent.com/d/${match[1]}=w512-h512`;

    loadUserPhoto(cdnUrl, photoTransform);


    await saveProfileToSheet({
      name: user.displayName,
      email: user.email,
      phone: userPhoneInput.value,
      college: userCollegeInput.value,
      photo: cdnUrl,
      transform: photoTransform
    });

    showToast("Photo updated!", "success");
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
  };

  logoutDesktop.onclick = logout;
  logoutMobile.onclick  = logout;
});


/* ---------- Toast CSS ---------- */
const style = document.createElement("style");
style.innerHTML = `
.toast {
  position: fixed; bottom: 30px; left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(0,0,0,0.85); color: white;
  padding: 12px 25px; border-radius: 25px;
  opacity: 0; transition: all .4s ease;
  z-index: 9999; border: 1px solid cyan;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.success { border-color: #00ff99; color: #00ffcc; }
.toast.error { border-color: #ff5555; color: #ff8888; }
.toast.info { border-color: cyan; color: cyan; }
`;
document.head.appendChild(style);

const editor = document.getElementById("photoEditor");
const canvas = document.getElementById("cropCanvas");
const ctx = canvas.getContext("2d");

const CIRCLE_RADIUS = canvas.width / 2;

let img = new Image();
img.crossOrigin = "anonymous";

let scale = 1;
let rotation = 0;
let pos = { x: 0, y: 0 };
let baseScale = 1;
let imageReady = false;
let dragging = false;
let start = { x: 0, y: 0 };
function getEffectiveSize() {
  const rotated = Math.abs(rotation / (Math.PI / 2)) % 2 === 1;
  return {
    w: rotated ? img.height : img.width,
    h: rotated ? img.width : img.height
  };
}

function computeBaseScale() {
  const { w, h } = getEffectiveSize();
  baseScale = Math.max(
    (CIRCLE_RADIUS * 2) / w,
    (CIRCLE_RADIUS * 2) / h
  );
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function clampPosition() {
  const { w, h } = getEffectiveSize();
  const halfW = (w * baseScale * scale) / 2;
  const halfH = (h * baseScale * scale) / 2;

  pos.x = clamp(pos.x, -(halfW - CIRCLE_RADIUS), halfW - CIRCLE_RADIUS);
  pos.y = clamp(pos.y, -(halfH - CIRCLE_RADIUS), halfH - CIRCLE_RADIUS);
}
function draw() {
  if (!imageReady) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.translate(canvas.width / 2 + pos.x, canvas.height / 2 + pos.y);
  ctx.rotate(rotation);
  ctx.scale(baseScale * scale, baseScale * scale);

  const rotated = Math.abs(rotation / (Math.PI / 2)) % 2 === 1;
  const w = rotated ? img.height : img.width;
  const h = rotated ? img.width : img.height;

  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
canvas.onmousedown = e => {
  dragging = true;
  start = { x: e.offsetX - pos.x, y: e.offsetY - pos.y };
};

canvas.onmousemove = e => {
  if (!dragging) return;
  pos.x = e.offsetX - start.x;
  pos.y = e.offsetY - start.y;
  clampPosition();
  draw();
};

canvas.onmouseup = () => dragging = false;

let lastTouch = null;
let pinchStartDist = 0;
let pinchStartScale = 1;

canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.touches.length === 2) {
    pinchStartDist = getDistance(e.touches[0], e.touches[1]);
    pinchStartScale = scale;
    lastTouch = null;
  }
}, { passive: false });
canvas.addEventListener("wheel", e => {
  e.preventDefault(); // 🔒 stop browser zoom

  const delta = -e.deltaY * 0.001;
  scale = Math.max(1, scale + delta);

  clampPosition();
  draw();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();

  if (e.touches.length === 1 && lastTouch) {
    pos.x += e.touches[0].clientX - lastTouch.x;
    pos.y += e.touches[0].clientY - lastTouch.y;
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    clampPosition();
    draw();
  }

  if (e.touches.length === 2) {
    const dist = getDistance(e.touches[0], e.touches[1]);
    scale = Math.max(1, pinchStartScale * (dist / pinchStartDist));
    clampPosition();
    draw();
  }
}, { passive: false });

function getDistance(t1, t2) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}
document.getElementById("zoomSlider").oninput = e => {
  scale = Math.max(1, Number(e.target.value));
  clampPosition();
  draw();
};

document.getElementById("rotateBtn").onclick = () => {
  rotation = (rotation + Math.PI / 2) % (Math.PI * 2);
  scale = 1;
  pos = { x: 0, y: 0 };
  computeBaseScale();
  draw();
};
document.getElementById("applyCrop").onclick = async () => {
  photoTransform = {
    x: pos.x,
    y: pos.y,
    zoom: scale,
    rotation
  };

  await saveProfileToSheet({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
    phone: document.getElementById("userPhone").value,
    college: document.getElementById("userCollege").value,
    photo: document.getElementById("userPhoto").src,
    transform: photoTransform
  });

  applyTransform(document.getElementById("userPhoto"), photoTransform);

  editor.classList.add("hidden");
  showToast("Photo position saved!", "success");
};
function applyTransform(img, t) {
  if (!t) return;

  img.style.transform = `
    translate(${t.x}px, ${t.y}px)
    scale(${t.zoom})
    rotate(${t.rotation}rad)
  `;
}

function resetPhotoTransform(img) {
  img.style.transform = "translate(0px, 0px) scale(1) rotate(0rad)";
}


document.getElementById("cancelCrop").onclick = () => {
  editor.classList.add("hidden");
  showToast("Photo edit cancelled", "info");
};
function openPhotoEditorFromExisting() {
  // 🚫 No photo → do nothing
  if (!userPhoto.src || userPhoto.src.includes("default-avatar")) {
    showToast("Upload a photo first", "info");
    return;
  }

  img.onload = () => {
    imageReady = true;

    // ✅ If transform exists → reuse
    if (photoTransform && Object.keys(photoTransform).length) {
      rotation = photoTransform.rotation || 0;
      scale    = photoTransform.zoom || 1;
      pos = {
        x: photoTransform.x || 0,
        y: photoTransform.y || 0
      };
    }
    // ✅ Else → fresh zero editor
    else {
      rotation = 0;
      scale = 1;
      pos = { x: 0, y: 0 };
    }

    computeBaseScale();
    clampPosition();
    draw();

    editor.classList.remove("hidden");
  };

  img.src = userPhoto.src + "&editor=" + Date.now();

}

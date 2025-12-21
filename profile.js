/* ==========================================================
   PRAVAAH — Profile Management System (Firebase + Apps Script)
========================================================== */

import { auth } from "./auth.js";
import { onAuthStateChanged, signOut, updateProfile } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const FRONTEND_BASE = "https://pravaahweb1.vercel.app";

/* ---------- Backend Script URL ---------- */
const scriptURL = "https://script.google.com/macros/s/AKfycbzHfIaAevmjjxUbFheA6EXHZFP2vqbVdEbHIDtIldQ1M7Acn3nyDmqrJBnFOQFFiLhxBQ/exec";
/* ---------- DEBUG ---------- */
const DEBUG_PROFILE = true;
const log = (...args) => {
  if (DEBUG_PROFILE) console.log("[PROFILE]", ...args);
};

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

function setEditMode(on, ctx) {
  isEditing = on;
  ctx.container.classList.toggle("is-edit", on);
  ctx.editActions.style.display = on ? "flex" : "none";

  ctx.uploadOptions.classList.toggle("hidden", !on);
  ctx.uploadOptions.style.display = on ? "flex" : "none";

  ctx.userPhoto.style.outline = on ? "2px dashed cyan" : "none";
  ctx.userPhoto.style.outlineOffset = "6px";
}

/* ---------- Save Profile ---------- */
async function saveProfileToSheet(profile) {
  const payload = JSON.stringify({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    college: profile.college || "",
    photo: profile.photo || "",
    transform: profile.transform || null,   // 🔥 ADD THIS
  });
await fetch(scriptURL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: payload
});

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
  if (!user) return (window.location.href = "index.html");

  const container = document.querySelector(".profile-container");
  const userPhoto = document.getElementById("userPhoto");
  const uploadPhotoInput = document.getElementById("uploadPhoto");
  const uploadOptions = document.getElementById("uploadOptions");
  const driveUploadBtn = document.getElementById("driveUploadBtn");

  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneInput = document.getElementById("userPhone");
  const userCollegeInput = document.getElementById("userCollege");
  const passesList = document.getElementById("passesList");

  const editActions = document.getElementById("editActions");
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  /* Prefill */
  /* Prefill basic info */
userNameEl.textContent = user.displayName || "PRAVAAH User";
userEmailEl.textContent = user.email;

/* Default photo first */
userPhoto.src = "default-avatar.png";

/* Load profile from Sheet */
const res = await fetch(
  `${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`
);
const p = await res.json();

if (p?.email) {
  userPhoneInput.value = p.phone || "";
  userCollegeInput.value = p.college || "";

  if (p.photo) {
    userPhoto.src = p.photo;

    userPhoto.onload = () => {
      userPhoto.classList.add("has-photo");

      if (p.transform) {
        photoTransform = p.transform;
        applyTransform(userPhoto, photoTransform);
      }
    };
  }
}
// ✅ Priority 2: Firebase photo
else if (user.photoURL) {
  userPhoto.src = user.photoURL;
}

// Hide placeholder once image loads
userPhoto.onload = () => {
  userPhoto.classList.add("has-photo");
};


  const phoneSpan = ensureFieldSpan(userPhoneInput, "userPhoneText");
  const collegeSpan = ensureFieldSpan(userCollegeInput, "userCollegeText");

  originalProfile = { phone: userPhoneInput.value, college: userCollegeInput.value };

  /* Load passes */
  const passes = await fetchUserPasses(user.email);
  renderPasses(passes, passesList, user.email);

  /* Edit toggle */
  document.getElementById("editPen").onclick = () => {
    originalProfile = { phone: userPhoneInput.value, college: userCollegeInput.value };
    setEditMode(!isEditing, { container, uploadOptions, userPhoto, editActions });
  };

  /* Save */
  document.getElementById("saveProfileBtn").onclick = async () => {
    // ✅ If photo editor was used, commit preview + transform
if (previewPhotoSrc && pendingTransform) {

  // ✅ upload FINAL cropped image to backend
  const r = await fetch(scriptURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "saveFinalPhoto",
      base64: previewPhotoSrc.split(",")[1]
    })
  });

  const out = await r.json();

  if (!out.ok) {
    showToast("Photo save failed", "error");
    return;
  }

  const finalPhotoUrl = out.url;

  await saveProfileToSheet({
    name: user.displayName,
    email: user.email,
    phone: userPhoneInput.value,
    college: userCollegeInput.value,
    photo: finalPhotoUrl,          // ✅ CDN URL
    transform: pendingTransform    // ✅ transform saved
  });

  await updateProfile(user, { photoURL: finalPhotoUrl });

  photoTransform = pendingTransform;
  previewPhotoSrc = null;
  pendingTransform = null;
}

    phoneSpan.textContent = userPhoneInput.value || "-";
    collegeSpan.textContent = userCollegeInput.value || "-";
    showToast("Profile updated!", "success");
    setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  };

  /* Cancel */
  document.getElementById("cancelEditBtn").onclick = () => {
    userPhoneInput.value = originalProfile.phone;
    userCollegeInput.value = originalProfile.college;
    phoneSpan.textContent = originalProfile.phone || "-";
    collegeSpan.textContent = originalProfile.college || "-";
    setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  };

  /* -------- DEVICE PHOTO UPLOAD -------- */
  document.getElementById("deviceUploadBtn").onclick = () => {
    if (!isEditing) return showToast("Tap ✏️ to edit", "info");
    uploadPhotoInput.click();
  };

  uploadPhotoInput.onchange = async (e) => {
  log("Device upload triggered");

  if (!e.target.files.length) {
    log("No file selected");
    return;
  }

  const file = e.target.files[0];
  log("File selected:", {
    name: file.name,
    size: file.size,
    type: file.type
  });

  const reader = new FileReader();

  reader.onload = async () => {
  log("Base64 generated");

  userPhoto.src = reader.result;

  const base64 = reader.result.split(",")[1];

  const payload = {
    type: "photoUpload",
    email: user.email,
    mimetype: file.type,
    file: base64
  };

  log("Upload payload summary:", {
    email: payload.email,
    mimetype: payload.mimetype,
    base64Length: base64.length
  });

  try {
    const r = await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    log("Upload response status:", r.status);

    const out = await r.json();
    log("Upload response JSON:", out);
if (out.ok) {
  // 🔥 Cache-busted URL so browser reloads image
  const finalPhoto = out.photo + "&t=" + Date.now();

  // 1️⃣ Update image immediately
  userPhoto.src = finalPhoto;

  // 2️⃣ Persist in Firebase (CRITICAL FIX)
  await updateProfile(user, {
    photoURL: finalPhoto
  });

  // 3️⃣ Hide placeholder text once image loads
  userPhoto.onload = () => {
    userPhoto.classList.add("has-photo");
  };

  showToast("Photo updated!", "success");
}
else {
      showToast("Upload failed", "error");
    }
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    showToast("Upload error", "error");
  }
};


  reader.readAsDataURL(file);
};

  /* -------- DRIVE PHOTO UPLOAD -------- */
  driveUploadBtn.onclick = async () => {
  if (!isEditing) return showToast("Tap ✏️ to edit", "info");

  const link = prompt("Paste Google Drive image link");
  if (!link) return;

  // 🔍 Extract file ID from ANY Drive link format
  const match = link.match(
    /(?:id=|\/d\/)([-\w]{25,})/
  );

  if (!match) {
    showToast("Invalid Google Drive link", "error");
    return;
  }

  const fileId = match[1];

  // ✅ Convert to IMAGE CDN (works everywhere)
  const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w512-h512`;

  // 1️⃣ Preview immediately
  userPhoto.src = cdnUrl;

  // 2️⃣ Save to Firebase (important)
  await updateProfile(user, { photoURL: cdnUrl });

  // 3️⃣ Save to Sheet
  await saveProfileToSheet({
    name: user.displayName,
    email: user.email,
    phone: userPhoneInput.value,
    college: userCollegeInput.value,
    photo: cdnUrl
  });

  userPhoto.onload = () => {
    userPhoto.classList.add("has-photo");
  };

  showToast("Photo updated!", "success");
};


  /* Logout */
  const logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
  };
  logoutDesktop.onclick = logout;
  logoutMobile.onclick = logout;
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
/* ==========================================================
   🖼️ PHOTO EDITOR — FINAL STATE-SAFE LOGIC
   (Preview only → Save commits → Cancel reverts)
========================================================== */

/* ---------- Photo State ---------- */
let originalPhotoSrc = null;      // before editing
let previewPhotoSrc = null;       // edited but not saved
let pendingTransform = null;      // transform waiting for save
let photoTransform = {};          // last saved transform

/* ---------- Editor Elements ---------- */
const editor = document.getElementById("photoEditor");
const canvas = document.getElementById("cropCanvas");
const ctx = canvas.getContext("2d");

const zoomSlider = document.getElementById("zoomSlider");
const rotateBtn = document.getElementById("rotateBtn");
const applyBtn = document.getElementById("applyCrop");
const cancelBtn = document.getElementById("cancelCrop");
const cameraBtn = document.getElementById("cameraBtn");

const R = canvas.width / 2;

let img = new Image();
img.crossOrigin = "anonymous";

let scale = 1;
let rotation = 0; // radians
let pos = { x: 0, y: 0 };
let baseScale = 1;
let dragging = false;
let start = { x: 0, y: 0 };
let imageReady = false;

/* ---------- Helpers ---------- */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function computeBaseScale() {
  baseScale = Math.max(
    (R * 2) / img.width,
    (R * 2) / img.height
  );
}

function clampPosition() {
  const hw = (img.width * baseScale * scale) / 2;
  const hh = (img.height * baseScale * scale) / 2;
  pos.x = clamp(pos.x, -(hw - R), hw - R);
  pos.y = clamp(pos.y, -(hh - R), hh - R);
}

/* ---------- Draw ---------- */
function draw() {
  if (!imageReady) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 + pos.x, canvas.height / 2 + pos.y);
  ctx.rotate(rotation);
  ctx.scale(baseScale * scale, baseScale * scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

/* ---------- Mouse Drag ---------- */
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

/* ---------- Touch Drag + Pinch ---------- */
let pinchStartDist = 0;
let pinchStartScale = 1;
let lastTouch = null;

canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.touches.length === 2) {
    pinchStartDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    pinchStartScale = scale;
  }
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
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    scale = Math.max(1, pinchStartScale * (dist / pinchStartDist));
    clampPosition();
    draw();
  }
}, { passive: false });

/* ---------- Controls ---------- */
zoomSlider.oninput = e => {
  scale = Number(e.target.value);
  clampPosition();
  draw();
};

rotateBtn.onclick = () => {
  rotation += Math.PI / 2;
  draw();
};

/* ---------- Open Editor ---------- */
cameraBtn.onclick = () => {
  if (!isEditing) return showToast("Tap ✏️ to edit first", "info");

  const userPhoto = document.getElementById("userPhoto");
  originalPhotoSrc = userPhoto.src;

  img.onload = () => {
    imageReady = true;

    rotation = (photoTransform.rotation || 0) * Math.PI / 180;
    scale = photoTransform.zoom || 1;
    pos = {
      x: photoTransform.x || 0,
      y: photoTransform.y || 0
    };

    computeBaseScale();
    clampPosition();
    draw();
    editor.classList.remove("hidden");
  };

  img.src = userPhoto.src + "?t=" + Date.now();
};

/* ---------- Apply (PREVIEW ONLY) ---------- */
applyBtn.onclick = () => {
  pendingTransform = {
    x: pos.x,
    y: pos.y,
    zoom: scale,
    rotation: rotation * 180 / Math.PI
  };

  const userPhoto = document.getElementById("userPhoto");
  applyTransform(userPhoto, pendingTransform);

  previewPhotoSrc = canvas.toDataURL("image/png");
  userPhoto.src = previewPhotoSrc;

  editor.classList.add("hidden");
  showToast("Photo ready. Click Save to apply.", "info");
};

/* ---------- Cancel ---------- */
cancelBtn.onclick = () => {
  if (originalPhotoSrc) {
    document.getElementById("userPhoto").src = originalPhotoSrc;
  }
  pendingTransform = null;
  previewPhotoSrc = null;
  editor.classList.add("hidden");
};

/* ---------- Apply Transform to <img> ---------- */
function applyTransform(imgEl, t) {
  imgEl.style.transform = `
    translate(-50%, -50%)
    translate(${t.x}px, ${t.y}px)
    scale(${t.zoom})
    rotate(${t.rotation}deg)
  `;
}




/* ==========================================================
   PRAVAAH — Profile Management System (Firebase + Apps Script)
========================================================== */

import { auth } from "./auth.js";
import { onAuthStateChanged, signOut, updateProfile } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const FRONTEND_BASE = "https://pravaahweb1.vercel.app";

/* ---------- Backend Script URL ---------- */
const scriptURL = "https://script.google.com/macros/s/AKfycbwC8l6uD6DL9bp6tVSFUgd5-i2e46yG3z51mx1vF4r9WR-s-u39Bvqk7PJh1b3YFv2EmQ/exec";
/* ---------- DEBUG ---------- */
const DEBUG_PROFILE = true;
const log = (...args) => {
  if (DEBUG_PROFILE) console.log("[PROFILE]", ...args);
};
let userPhoto;
let userPhoneInput;
let userCollegeInput;
let baseScale = 1;
document.addEventListener("mouseup", () => {
  dragging = false;
});


async function fetchImageAsBase64(url) {
  const r = await fetch(
    `${scriptURL}?type=imageToBase64&url=${encodeURIComponent(url)}`
  );
  const j = await r.json();
  if (!j.ok) throw new Error("Image fetch failed");
  return j.base64;
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
    photo: profile.photo || ""
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
  if (!user) return (window.location.href = "index.html");

  const container = document.querySelector(".profile-container");
  userPhoto = document.getElementById("userPhoto");
  const uploadPhotoInput = document.getElementById("uploadPhoto");
  const uploadOptions = document.getElementById("uploadOptions");
  const driveUploadBtn = document.getElementById("driveUploadBtn");

  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  userPhoneInput = document.getElementById("userPhone");
  userCollegeInput = document.getElementById("userCollege");
  const passesList = document.getElementById("passesList");

  const editActions = document.getElementById("editActions");
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");
const photoOverlay = document.querySelector(".photo-overlay");

photoOverlay.onclick = async () => {
  if (!isEditing) {
    showToast("Tap ✏️ to edit profile", "info");
    return;
  }

  scale = 1;
  rotation = 0;
  pos = { x: 0, y: 0 };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  editor.classList.remove("hidden");

  const base64 = await fetchImageAsBase64(userPhoto.src);
  img.src = base64;
};



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

  // ✅ Priority 1: Sheet photo (Drive)
  if (p.photo) {
    userPhoto.src = p.photo;
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
    await saveProfileToSheet({
      name: user.displayName,
      email: user.email,
      phone: userPhoneInput.value,
      college: userCollegeInput.value,
      photo: userPhoto.src
    });
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
const editor = document.getElementById("photoEditor");
const canvas = document.getElementById("cropCanvas");
const ctx = canvas.getContext("2d");

const CIRCLE_RADIUS = canvas.width / 2;


let img = new Image();
let scale = 1;
let rotation = 0;
let pos = { x: 0, y: 0 };
let dragging = false;
let start = { x: 0, y: 0 };

/* OPEN EDITOR ONLY IN EDIT MODE */


img.onload = () => {
  baseScale = Math.max(
    (CIRCLE_RADIUS * 2) / img.width,
    (CIRCLE_RADIUS * 2) / img.height
  );

  scale = 1; // relative scale
  pos = { x: 0, y: 0 };
  draw();
};
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}



function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.translate(
    canvas.width / 2 + pos.x,
    canvas.height / 2 + pos.y
  );

  ctx.rotate(rotation);

  const finalScale = baseScale * scale;
  ctx.scale(finalScale, finalScale);

  ctx.drawImage(
    img,
    -img.width / 2,
    -img.height / 2
  );

  ctx.restore();
}



/* DRAG */
canvas.onmousedown = e => {
  dragging = true;
  start = { x: e.offsetX - pos.x, y: e.offsetY - pos.y };
};
canvas.onmousemove = e => {
  if (!dragging) return;

  pos.x = e.offsetX - start.x;
  pos.y = e.offsetY - start.y;

  const halfW = (img.width * baseScale * scale) / 2;
  const halfH = (img.height * baseScale * scale) / 2;

  const maxX = Math.max(0, halfW - CIRCLE_RADIUS);
  const maxY = Math.max(0, halfH - CIRCLE_RADIUS);

  pos.x = clamp(pos.x, -maxX, maxX);
  pos.y = clamp(pos.y, -maxY, maxY);

  draw();
};


canvas.onmouseup = () => dragging = false;

/* ZOOM */
document.getElementById("zoomSlider").oninput = e => {
  scale = Math.max(1, Number(e.target.value));
  draw();
};

/* ===== TOUCH DRAG (MOBILE) ===== */
let lastTouch = null;

/* ===== TOUCH START (DRAG + PINCH) ===== */
canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    const t = e.touches[0];
    lastTouch = { x: t.clientX, y: t.clientY };
  }

  if (e.touches.length === 2) {
    pinchStartDist = getDistance(e.touches[0], e.touches[1]);
    pinchStartScale = scale;
    lastTouch = null; // disable drag during pinch
  }
}, { passive: false });


canvas.addEventListener("touchmove", e => {
  if (e.touches.length === 1 && lastTouch) {
    e.preventDefault();

    const t = e.touches[0];
    const dx = t.clientX - lastTouch.x;
    const dy = t.clientY - lastTouch.y;

    pos.x += dx;
    pos.y += dy;

    const halfW = (img.width * baseScale * scale) / 2;
    const halfH = (img.height * baseScale * scale) / 2;

    const maxX = Math.max(0, halfW - CIRCLE_RADIUS);
    const maxY = Math.max(0, halfH - CIRCLE_RADIUS);

    pos.x = clamp(pos.x, -maxX, maxX);
    pos.y = clamp(pos.y, -maxY, maxY);

    lastTouch = { x: t.clientX, y: t.clientY };
    draw();
  }

  if (e.touches.length === 2) {
    e.preventDefault();

    const dist = getDistance(e.touches[0], e.touches[1]);
    scale = Math.max(
      1,
      Math.min(4, pinchStartScale * (dist / pinchStartDist))
    );

    draw();
  }
}, { passive: false });




canvas.addEventListener("touchend", e => {
  if (e.touches.length === 0) {
    lastTouch = null;
    pinchStartDist = 0;
  }
});

/* ===== PINCH TO ZOOM ===== */
let pinchStartDist = 0;
let pinchStartScale = 1;

function getDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}



/* ROTATE */
document.getElementById("rotateBtn").onclick = () => {
  rotation += Math.PI / 2;
  draw();
};

/* CANCEL */
document.getElementById("cancelCrop").onclick = () => {
  editor.classList.add("hidden");
};

/* APPLY */
document.getElementById("applyCrop").onclick = async () => {
  const base64 = canvas.toDataURL("image/png").split(",")[1];

  const r = await fetch(scriptURL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      type: "saveFinalPhoto",
      base64
    })
  });

  const out = await r.json();
  if (!out.ok) {
    showToast("Save failed", "error");
    return;
  }

  const cdnUrl = out.url + "&t=" + Date.now();

  userPhoto.src = cdnUrl;

  await updateProfile(auth.currentUser, {
    photoURL: cdnUrl
  });

  await saveProfileToSheet({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
    phone: userPhoneInput.value,
    college: userCollegeInput.value,
    photo: cdnUrl
  });

  editor.classList.add("hidden");
  showToast("Photo updated!", "success");
};
































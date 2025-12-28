/* ==========================================================
   PRAVAAH — Profile Management System (Firebase + Apps Script)
========================================================== */

import { auth } from "./auth.js";
import { onAuthStateChanged, signOut, updateProfile } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const FRONTEND_BASE = "https://pravaahweb1.vercel.app";

/* ---------- Backend Script URL ---------- */
const scriptURL = "https://script.google.com/macros/s/AKfycbw6U9Flw5hjv8RXF_4APCfOp3hxdY_X51xjl12hfoxTcRIu7PHedAewQDjUYILwpqlELw/exec";
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
let activeToast = null;
let userPhoto = null;

function showPersistentToast(message, type = "info") {
  if (activeToast) activeToast.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type} show`;
  toast.textContent = message;
  document.body.appendChild(toast);

  activeToast = toast;
}

function updatePersistentToast(message, type = "info") {
  if (!activeToast) return;
  activeToast.className = `toast ${type} show`;
  activeToast.textContent = message;
}

function closePersistentToast() {
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }
}

/* ---------- State ---------- */
let isEditing = false;
let originalProfile = { phone: "", college: "" };


/* ---------- Save Profile ---------- */
async function saveProfileToSheet(profile) {
  await fetch(scriptURL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      type: "saveProfile",
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      college: profile.college || "",
      photo: profile.photo || "",
      transform: profile.transform || null
    })
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
  userPhoto = document.getElementById("userPhoto");
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
const cameraBtn = document.getElementById("cameraBtn"); // <-- FIX
cameraBtn.style.display = "none"; // hidden until edit enabled
function applyTransformToMainPhoto(t) {
  if (!t || !userPhoto) return;

  userPhoto.style.transform = `
    translate(-50%, -50%)
    translate(${t.x}px, ${t.y}px)
    scale(${t.zoom})
    rotate(${t.rotation}deg)
  `;
}

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
if (p?.transform) {
  savedTransform = typeof p.transform === "string"
    ? JSON.parse(p.transform)
    : p.transform;

  userPhoto.onload = () => {
    userPhoto.classList.add("has-photo");
    applyTransformToMainPhoto(savedTransform);
  };
}

function applyTransformToMainPhoto(t) {
  if (!userPhoto) return;

  userPhoto.style.transform =
    `translate(-50%, -50%)
     translate(${t.x}px, ${t.y}px)
     scale(${t.zoom})
     rotate(${t.rotation}deg)`;
}



// Hide placeholder once image loads
userPhoto.onload = () => {
  userPhoto.classList.add("has-photo");
};
function setEditMode(on, ctx) {
  isEditing = on;
  ctx.container.classList.toggle("is-edit", on);
  ctx.editActions.style.display = on ? "flex" : "none";

  ctx.uploadOptions.classList.toggle("hidden", !on);
  ctx.uploadOptions.style.display = on ? "flex" : "none";

  ctx.userPhoto.style.outline = on ? "2px dashed cyan" : "none";
  ctx.userPhoto.style.outlineOffset = "6px";

  document.getElementById("cameraBtn").style.display = on ? "flex" : "none";  // ⭐ camera visible only in edit mode
}


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

uploadPhotoInput.onchange = (e) => {
  if (!e.target.files.length) return;

  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const previewSrc = reader.result;
    const base64 = previewSrc.split(",")[1];

    // 🔒 1. Show persistent uploading toast
    showPersistentToast("Uploading photo… please wait", "info");

    // 🔒 2. Fire backend upload (do NOT wait)
    fetch(scriptURL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        type: "photoUpload",
        email: user.email,
        mimetype: file.type,
        file: base64
      })
    });

    // 🔒 3. Set preview but DO NOT open editor yet
    userPhoto.src = previewSrc;
    originalPhotoSrc = previewSrc;
    previewPhotoSrc = previewSrc;

    pendingTransform = { x: 0, y: 0, zoom: 1, rotation: 0 };
    savedTransform = null;

    // 🔒 4. Wait for browser to fully decode image
    userPhoto.onload = () => {
      userPhoto.classList.add("has-photo");

      // extra delay = GPU + canvas safety
      setTimeout(() => {
        updatePersistentToast("Photo ready for editing", "success");
        openEditor();               // ✅ SAFE NOW
        // Close toast when editor is actually visible
setTimeout(() => {
  if (!editor.classList.contains("hidden")) {
    closePersistentToast();
  }
}, 800);

      }, 400);
    };
  };

  reader.readAsDataURL(file);
};



  /* -------- DRIVE PHOTO UPLOAD -------- */
  driveUploadBtn.onclick = async () => {
  if (!isEditing) return showToast("Tap ✏️ to edit", "info");

  const link = prompt("Paste Google Drive image link");
  if (!link) return;

  const match = link.match(/(?:id=|\/d\/)([-\w]{25,})/);
  if (!match) {
    showToast("Invalid Google Drive link", "error");
    return;
  }

  const fileId = match[1];
  const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w512-h512`;

  // ✅ Update UI
  userPhoto.src = cdnUrl;
  originalPhotoSrc = cdnUrl;
  previewPhotoSrc = cdnUrl;

  // ✅ Save ONLY to Sheets
  await saveProfileToSheet({
    name: userNameEl.textContent,
    email: user.email,
    phone: userPhoneInput.value,
    college: userCollegeInput.value,
    photo: cdnUrl
  });

  userPhoto.onload = () => {
    userPhoto.classList.add("has-photo");
  };

  showToast("Photo updated", "success");
};

document.getElementById("saveProfileBtn").onclick = async () => {
  await saveProfileToSheet({
    name: userNameEl.textContent,
    email: user.email,
    phone: userPhoneInput.value,
    college: userCollegeInput.value,
    photo: userPhoto.src, // FINAL truth
    transform: pendingTransform
      ? JSON.stringify(pendingTransform)
      : savedTransform
      ? JSON.stringify(savedTransform)
      : null
  });

  // ✅ persist transform
  if (pendingTransform) {
    savedTransform = pendingTransform;
  }
   if (savedTransform) {
  applyTransformToMainPhoto(savedTransform);
}
  pendingTransform = null;
  previewPhotoSrc = null;

  // ✅ EXIT EDIT MODE
  isEditing = false;
  setEditMode(false, { container, uploadOptions, userPhoto, editActions });

  // ✅ RESET outlines / editor
  editor.classList.add("hidden");

  showToast("Profile Updated", "success");
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
   🖼 FINAL PHOTO TRANSFORM + SAVE SYSTEM (FULL WORKING)
========================================================== */

let originalPhotoSrc = null;
let previewPhotoSrc = null;
let pendingTransform = null;
let savedTransform = null;

const editor = document.getElementById("photoEditor");
const canvas = document.getElementById("cropCanvas");
const ctx2 = canvas.getContext("2d");

const zoomRange = document.getElementById("zoomSlider");
const rotateBtn2 = document.getElementById("rotateBtn");
const cropApply = document.getElementById("applyCrop");
const cropCancel = document.getElementById("cancelCrop");

let img2 = new Image();
img2.crossOrigin = "anonymous";

let scaleV = 1;
let rotV = 0;
let offset = { x:0, y:0 };
let baseFit = 1;
const RING = canvas.width/2;
let drag=false, startPos={x:0,y:0};

function baseScaleCalc(){
    baseFit = Math.max((RING*2)/img2.width , (RING*2)/img2.height);
}

function clampXY() {
  const w = img2.width * baseFit * scaleV;
  const h = img2.height * baseFit * scaleV;

  // rotation-aware bounding box
  const sin = Math.abs(Math.sin(rotV));
  const cos = Math.abs(Math.cos(rotV));

  const boundW = w * cos + h * sin;
  const boundH = w * sin + h * cos;

  const limitX = Math.max(0, (boundW / 2) - RING);
  const limitY = Math.max(0, (boundH / 2) - RING);

  offset.x = Math.max(-limitX, Math.min(limitX, offset.x));
  offset.y = Math.max(-limitY, Math.min(limitY, offset.y));
}


function redraw(){
  ctx2.clearRect(0,0,260,260);
  ctx2.save();
  ctx2.translate(130+offset.x ,130+offset.y);
  ctx2.rotate(rotV);
  ctx2.scale(baseFit*scaleV ,baseFit*scaleV);
  ctx2.drawImage(img2,-img2.width/2,-img2.height/2);
  ctx2.restore();
}

/* Click camera → open editor */
cameraBtn.onclick = () => {
  if (!isEditing) return showToast("Click ✏️ Edit first", "info");
  openEditor();
};
function openEditor() {
  if (!userPhoto.src || userPhoto.src.includes("default-avatar")) {
    showToast("Upload a photo first", "info");
    return;
  }
  originalPhotoSrc = document.getElementById("userPhoto").src;
  img2.src = originalPhotoSrc + "?t=" + Date.now();

  img2.onload = () => {
    scaleV = savedTransform?.zoom || 1;
    rotV   = (savedTransform?.rotation || 0) * Math.PI/180;
    offset.x = savedTransform?.x || 0;
    offset.y = savedTransform?.y || 0;

    baseScaleCalc();
    clampXY();
    redraw();
    editor.classList.remove("hidden");
  };
}


/* Zoom */
zoomRange.oninput=(e)=>{ scaleV=parseFloat(e.target.value); clampXY(); redraw(); }

/* Rotate */
rotateBtn2.onclick=()=>{ rotV+=Math.PI/2; redraw(); }

/* Drag Move */
canvas.onmousedown=e=>{ drag=true; startPos={x:e.offsetX-offset.x,y:e.offsetY-offset.y}; }
canvas.onmousemove=e=>{ 
    if(!drag) return; 
    offset.x=e.offsetX-startPos.x; offset.y=e.offsetY-startPos.y; 
    clampXY(); redraw(); 
};
canvas.onmouseup=()=>drag=false;


/* Apply Preview */
cropApply.onclick = () => {
  pendingTransform = {
    x: offset.x,
    y: offset.y,
    zoom: scaleV,
    rotation: (rotV * 180 / Math.PI) % 360
  };

  // ✅ APPLY PREVIEW DIRECTLY TO PROFILE IMAGE
  applyTransformToMainPhoto(pendingTransform);

  editor.classList.add("hidden");
  showToast("Preview ready — click SAVE PROFILE", "info");
};



/* Cancel Edit */
cropCancel.onclick=()=>{
   document.getElementById("userPhoto").src=originalPhotoSrc;
   pendingTransform=null; previewPhotoSrc=null;
   editor.classList.add("hidden");
};






/* Drag Move (Mouse) */
canvas.onmousedown = e => { drag=true; startPos={x:e.offsetX-offset.x,y:e.offsetY-offset.y}; }
canvas.onmousemove = e => { 
    if(!drag) return; 
    offset.x=e.offsetX-startPos.x; 
    offset.y=e.offsetY-startPos.y;
    clampXY(); redraw(); 
};
canvas.onmouseup   = ()=> drag=false;
canvas.onmouseleave= ()=> drag=false;
/* ===========================
   📱 Touch Support (Drag + Pinch Zoom)
=========================== */
let lastTouchDist = 0;
let isPinching = false;

canvas.addEventListener("touchstart", (e)=>{
    if(e.touches.length === 1){
        // One finger drag
        drag = true;
        const t = e.touches[0];
        startPos = { x:t.clientX-offset.x, y:t.clientY-offset.y };
    } 
    else if(e.touches.length === 2){
        // Two finger zoom start
        isPinching = true;
        lastTouchDist = getTouchDistance(e.touches);
    }
},{passive:false});


canvas.addEventListener("touchmove",(e)=>{
    e.preventDefault();

    if(isPinching && e.touches.length === 2){
        const newDist = getTouchDistance(e.touches);
        const diff = newDist - lastTouchDist;

        scaleV += diff*0.002;  // sensitivity
        scaleV = Math.min(3, Math.max(1, scaleV)); // limit zoom 1x to 3x

        lastTouchDist = newDist;
        clampXY(); redraw();
    }
    else if(drag && e.touches.length === 1){
        const t = e.touches[0];
        offset.x = t.clientX - startPos.x;
        offset.y = t.clientY - startPos.y;
        clampXY(); redraw();
    }
},{passive:false});


canvas.addEventListener("touchend",(e)=>{
    if(e.touches.length < 2) isPinching=false;
    if(e.touches.length === 0) drag=false;
});

/* Distance for pinch */
function getTouchDistance(t){
    const x = t[0].clientX - t[1].clientX;
    const y = t[0].clientY - t[1].clientY;
    return Math.sqrt(x*x + y*y);
}


function renderProfilePhoto(photoUrl, transform) {
  const canvas = document.getElementById("profileCanvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = photoUrl + "?t=" + Date.now();

  img.onload = () => {
    const R = canvas.width / 2;

    const baseFit = Math.max(
      (R * 2) / img.width,
      (R * 2) / img.height
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(R + transform.x, R + transform.y);
    ctx.rotate(transform.rotation * Math.PI / 180);
    ctx.scale(baseFit * transform.zoom, baseFit * transform.zoom);

    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    ctx.restore();
  };
}


















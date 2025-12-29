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
function applyTransformToMainPhoto(t) {
  if (!t || !userPhoto) return;

  userPhoto.style.transform = `
    translate(-50%, -50%)
    translate(${t.x}px, ${t.y}px)
    scale(${t.zoom})
    rotate(${t.rotation}deg)
  `;
}

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
// ⭐ Stores last saved state when user uploads new photo (for cancel restore)
let lastSavedPhoto = null;
let lastSavedTransform = null;


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
// 🔥 Load cached data instantly without waiting server


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
   
/* ===============================
   🚀 FAST LOAD — CACHE FIRST
===============================*/
userNameEl.textContent = user.displayName || "PRAVAAH User";
userEmailEl.textContent = user.email;

const cachedProfile = getCachedProfile(user.email);
if(cachedProfile){
    userPhoneInput.value = cachedProfile.phone || "";
    userCollegeInput.value = cachedProfile.college || "";
    userPhoto.src = cachedProfile.photo || "default-avatar.png";

    if(cachedProfile.transform){
        savedTransform = cachedProfile.transform;
        renderProfilePhoto(cachedProfile.photo,cachedProfile.transform);
    }
}

/* ===============================
   🔄 LIVE FETCH — ALWAYS UPDATE if sheet changed
===============================*/
let p=null;
try{
    const r = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
    p = await r.json();

    if(p?.email){
        userPhoneInput.value = p.phone || "";
        userCollegeInput.value = p.college || "";
        if(p.photo) userPhoto.src = p.photo;

        if(p.transform){
            savedTransform = JSON.parse(p.transform);
            renderProfilePhoto(p.photo,savedTransform);
        }

        cacheProfile({
            email:user.email,
            name:user.displayName,
            phone:p.phone,
            college:p.college,
            photo:p.photo,
            transform:p.transform?JSON.parse(p.transform):null
        });
    }
}catch(e){ console.log("Offline, loading from cache"); }

/* ===============================
   If new user — show default
===============================*/
if(!p?.photo && !cachedProfile){
    userPhoto.src="default-avatar.png";
    renderProfilePhoto("default-avatar.png",{x:0,y:0,zoom:1,rotation:0});
}

/* Ensure transform only after image fully loads */
userPhoto.onload = ()=>{
    renderProfilePhoto(userPhoto.src,savedTransform||{x:0,y:0,zoom:1,rotation:0});
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
  /* ==========================================================
   🚀 Pass Loader with Cache + Multi-Device Sync
========================================================== */

// 1️⃣ Load cached passes instantly (fast UI, even offline)
const cachedPasses = getCachedPasses(user.email);
if(cachedPasses){
  renderPasses(cachedPasses, passesList, user.email);
}

// 2️⃣ Fetch fresh passes from backend & update
(async()=>{
  try{
      const fresh = await fetchUserPasses(user.email);

      if(JSON.stringify(fresh) !== JSON.stringify(cachedPasses)){
          cachePasses(user.email, fresh);         // update local cache
          renderPasses(fresh, passesList, user.email);
          console.log("🔄 Passes synced from cloud");
      }
  }catch(e){
      console.warn("Fetch failed (offline?)",e);
  }
})();
/* 🔁 Background sync every 60 seconds */
setInterval(async ()=>{
  try{
      const fresh = await fetchUserPasses(user.email);
      const cached = getCachedPasses(user.email);

      if(JSON.stringify(fresh) !== JSON.stringify(cached)){
          cachePasses(user.email, fresh);
          renderPasses(fresh, passesList, user.email);
      }
  }catch(err){
      console.log("Sync error",err);
  }
},60000);
/* 🔁 Profile Auto-Sync every 60 sec */
setInterval(async ()=>{
  try{
      const r = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
      const newP = await r.json();
      const old = getCachedProfile(user.email);

      if(JSON.stringify(newP) !== JSON.stringify(old)){
          console.log("🔄 Profile synced from cloud");

          userPhoneInput.value = newP.phone || "";
          userCollegeInput.value = newP.college || "";
          if(newP.photo){
              userPhoto.src = newP.photo;
              savedTransform = newP.transform ? JSON.parse(newP.transform) : null;
              renderProfilePhoto(newP.photo, savedTransform || {x:0,y:0,zoom:1,rotation:0});
          }

          cacheProfile({
              email:user.email,
              name:newP.name,
              phone:newP.phone,
              college:newP.college,
              photo:newP.photo,
              transform:newP.transform?JSON.parse(newP.transform):null
          });
      }
  }catch(e){}
},60000);


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

  // revert photo & transform fully
  // 🔥 FULL CORRECT RESTORE LOGIC
if (pendingTransform || previewPhotoSrc) {
    // restore last actual saved DP (from cache/sheet)
    const profile = getCachedProfile(user.email);
    if(profile?.photo){
        userPhoto.src = profile.photo;
        renderProfilePhoto(profile.photo, profile.transform || {x:0,y:0,zoom:1,rotation:0});
    }
} else {
    // no new upload → restore old values
    renderProfilePhoto(originalPhotoSrc, savedTransform);
}


  setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  showToast("Edit cancelled", "info");
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

  showPersistentToast("Uploading photo…", "info");

  reader.onload = () => {
    const previewSrc = reader.result;
    const base64 = previewSrc.split(",")[1];
    // Show preview on img and canvas
    userPhoto.src = previewSrc;
    originalPhotoSrc = previewSrc;
    previewPhotoSrc = previewSrc;
pendingTransform = {x:0,y:0,zoom:1,rotation:0};
savedTransform = {x:0,y:0,zoom:1,rotation:0};   // default for new image
renderProfilePhoto(previewSrc, pendingTransform);


    ////// ⭐ AUTO-OPEN EDITOR ⭐ //////
    setTimeout(() => {
      closePersistentToast();
      img2.src = previewSrc;
      img2.onload = () => {
        baseScaleCalc();
        redraw();
        editor.classList.remove("hidden"); // show editor window
      };
      showToast("Crop/Zoom/Rotate → Press Done ✔", "success");
    }, 900);
  };

  reader.readAsDataURL(file);
};

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
  const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1024-h1024`;

  // 🔥 Update UI instantly like device upload
  userPhoto.src = cdnUrl;
  originalPhotoSrc = cdnUrl;
  previewPhotoSrc = cdnUrl;
  pendingTransform = {x:0,y:0,zoom:1,rotation:0};
savedTransform = pendingTransform;
renderProfilePhoto(cdnUrl, pendingTransform);


  // 🌟 Open editor just like device upload
  setTimeout(() => {
    img2.src = cdnUrl + "?t=" + Date.now();
    img2.onload = () => {
      baseScaleCalc();
      clampXY();
      redraw();
      editor.classList.remove("hidden");
    };
  }, 400);

  showToast("Drive image applied — adjust & Save ✔", "success");
};


document.getElementById("saveProfileBtn").onclick = async () => {

  // ⬇️ Upload only when saving
  if(previewPhotoSrc){
    const base64 = previewPhotoSrc.split(",")[1];
    await fetch(scriptURL,{
      method:"POST",
      mode:"no-cors",
      body:JSON.stringify({
        type:"photoUpload",
        email:user.email,
        file:base64,
        mimetype:"image/jpeg"
      })
    });
  }

  await saveProfileToSheet({
    name:userNameEl.textContent,
    email:user.email,
    phone:userPhoneInput.value,
    college:userCollegeInput.value,
    photo:userPhoto.src,
    transform:pendingTransform
      ? JSON.stringify(pendingTransform)
      : savedTransform
      ? JSON.stringify(savedTransform)
      : null
  });

  if(pendingTransform) savedTransform=pendingTransform;

  pendingTransform=null;
  previewPhotoSrc=null;
  editor.classList.add("hidden");
  isEditing=false;
  setEditMode(false,{container,uploadOptions,userPhoto,editActions});

  cacheProfile({
    email:user.email,
    name:userNameEl.textContent,
    phone:userPhoneInput.value,
    college:userCollegeInput.value,
    photo:userPhoto.src,
    transform:savedTransform
  });

  showToast("Profile Updated", "success");
};


document.addEventListener("visibilitychange", async ()=>{
    if(document.visibilityState === "visible"){       // user comes back to tab
        try{
            const fresh = await fetchUserPasses(user.email);
            const cached = getCachedPasses(user.email);

            if(JSON.stringify(fresh) !== JSON.stringify(cached)){
                cachePasses(user.email, fresh);
                renderPasses(fresh, passesList, user.email);
            }
        }catch(e){}
    }
});



  /* Logout */
  const logout = async () => {
    const email = auth.currentUser?.email;
    if(email){
  clearProfileCache(email);
  clearPassCache(email);
}
   // 🧹 delete cached profile
    sessionStorage.clear();               // 🧹 clear dashboard role cache
    localStorage.removeItem("pravaah_profile_" + email); // extra safety

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



/* Zoom */
zoomRange.oninput=(e)=>{ scaleV=parseFloat(e.target.value); clampXY(); redraw(); }
/* =====================
   Zoom Buttons Click
===================== */
document.getElementById("zoomOutBtn").onclick = ()=>{
    scaleV = Math.max(1, scaleV - 0.1);       // Step size 0.1
    zoomRange.value = scaleV;
    clampXY(); redraw();
};

document.getElementById("zoomInBtn").onclick = ()=>{
    scaleV = Math.min(3, scaleV + 0.1);
    zoomRange.value = scaleV;
    clampXY(); redraw();
};
/* ===================================================
   HOLD TO ZOOM — Smooth Instagram-style
=================================================== */

const zoomInBtn  = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

let zoomHoldInterval = null;
const zoomStep = 0.03;    // step size per zoom tick
const holdSpeed = 55;     // lower = faster zoom

function holdZoom(delta){
  clearInterval(zoomHoldInterval);
  zoomHoldInterval = setInterval(()=>{
    scaleV = Math.max(1, Math.min(3, scaleV + delta));
    zoomRange.value = scaleV;
    clampXY(); redraw();
  }, holdSpeed);
}

function stopHold(){ clearInterval(zoomHoldInterval); }

/* ---- Mouse Hold ---- */
zoomInBtn.onmousedown  = ()=> holdZoom(+zoomStep);
zoomOutBtn.onmousedown = ()=> holdZoom(-zoomStep);
document.addEventListener("mouseup", stopHold);

/* ---- Mobile Hold ---- */
zoomInBtn.ontouchstart  = (e)=>{ e.preventDefault(); holdZoom(+zoomStep); }
zoomOutBtn.ontouchstart = (e)=>{ e.preventDefault(); holdZoom(-zoomStep); }
zoomInBtn.ontouchend = zoomOutBtn.ontouchend = stopHold;

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

  // Keep preview only for editing, but don't overwrite last saved photo
  pendingTransform = {
    x: offset.x,
    y: offset.y,
    zoom: scaleV,
    rotation: (rotV * 180 / Math.PI) % 360
  };

  // Preview into main UI (temporary)
  renderProfilePhoto(previewPhotoSrc || originalPhotoSrc, pendingTransform);

  editor.classList.add("hidden");
  showToast("Preview ready — click SAVE PROFILE to apply", "info");
};




/* Cancel Edit */
cropCancel.onclick = () => {
  editor.classList.add("hidden");

  const cached = getCachedProfile(user.email);

  if (cached?.photo) {
      userPhoto.src = cached.photo;

      // 🔥 FIX — now apply transform instantly
      let T = cached.transform || {x:0,y:0,zoom:1,rotation:0};
      savedTransform = T;                      // keep for session
      renderProfilePhoto(cached.photo, T);
  } else {
      userPhoto.src = "default-avatar.png";
      savedTransform = {x:0,y:0,zoom:1,rotation:0};
      renderProfilePhoto("default-avatar.png", savedTransform);
  }

  // reset unsaved changes
  previewPhotoSrc = null;
  pendingTransform = null;

  showToast("Changes discarded — restored previous profile", "info");
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
📱 Mobile Touch + Pinch Zoom Support
=========================== */

let dragging = false;
let start = {x:0,y:0};
let lastZoomDist = 0;

canvas.style.touchAction = "none";   // VERY IMPORTANT

canvas.addEventListener("touchstart",(e)=>{
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();

    // One finger → drag
    if(e.touches.length === 1){
        dragging = true;
        start.x = (e.touches[0].clientX - rect.left) - offset.x;
        start.y = (e.touches[0].clientY - rect.top) - offset.y;
    }

    // Two finger → start pinch
    if(e.touches.length === 2){
        dragging = false;
        lastZoomDist = getDist(e.touches);
    }

},{passive:false});

/* ======================
   Desktop Scroll Zoom
====================== */
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const zoomSpeed = 0.0015; // adjust smoothness
  scaleV += -e.deltaY * zoomSpeed;
scaleV = Math.max(1, Math.min(scaleV, 3));

zoomRange.value = scaleV.toFixed(2);   // sync slider with scroll zoom

clampXY(); redraw();

},{passive:false});

canvas.addEventListener("touchmove",(e)=>{
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();

    // Pinch Zoom
    if(e.touches.length === 2){
        let dist = getDist(e.touches);
        let change = dist - lastZoomDist;

        scaleV += change * 0.004;
scaleV = Math.max(1, Math.min(scaleV, 3));

zoomRange.value = scaleV.toFixed(2);   // <-- slider updates realtime 🔥

lastZoomDist = dist;
clampXY(); redraw();

    }

    // Drag
    if(e.touches.length === 1 && dragging){
        offset.x = (e.touches[0].clientX - rect.left) - start.x;
        offset.y = (e.touches[0].clientY - rect.top) - start.y;
        clampXY(); redraw();
    }

},{passive:false});


canvas.addEventListener("touchend",()=> dragging=false);

function getDist(t){
    const x = t[0].clientX - t[1].clientX;
    const y = t[0].clientY - t[1].clientY;
    return Math.sqrt(x*x+y*y);
}



function renderProfilePhoto(photoUrl, transform) {
  const canvas = document.getElementById("profileCanvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = photoUrl;

  img.onload = () => {
    const R = canvas.width / 2;

    const baseFit = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(
      R + (transform?.x || 0),
      R + (transform?.y || 0)
    );

    ctx.rotate(((transform?.rotation || 0) * Math.PI) / 180);
    ctx.scale(
      baseFit * (transform?.zoom || 1),
      baseFit * (transform?.zoom || 1)
    );

    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };
}
/* ==========================================================
   📌 LOCAL CACHE SYSTEM (Saves after each update)
========================================================== */

function cacheProfile(data) {
  const key = "pravaah_profile_" + data.email;  // separate cache per user
  localStorage.setItem(key, JSON.stringify(data));
}

function getCachedProfile(email) {
  const key = "pravaah_profile_" + email;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : null;
}

function clearProfileCache(email) {
  localStorage.removeItem("pravaah_profile_" + email);
}
/* ==========================================================
   📌 LOCAL PASS CACHE SYSTEM
========================================================== */

function cachePasses(email, passes){
  localStorage.setItem("pravaah_passes_" + email, JSON.stringify(passes));
}

function getCachedPasses(email){
  const data = localStorage.getItem("pravaah_passes_" + email);
  return data ? JSON.parse(data) : null;
}

function clearPassCache(email){
  localStorage.removeItem("pravaah_passes_" + email);
}






















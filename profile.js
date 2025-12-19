/* ==========================================================
   PRAVAAH — Profile Management System (Firebase + Apps Script)
========================================================== */

import { auth } from "./auth.js";
import { onAuthStateChanged, signOut, updateProfile } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxfQSKhKKyuV5Jk9e3MChtUTVVFL1onq51iByv5MqGuTPjsIWeOh9JOzvqCU7-tz3ZyYQ/exec";
/* ---------- Backend Script URL ---------- */
const scriptURL = "/api/pravaah";

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
const qrUrl = `${GAS_URL}?paymentId=${encodeURIComponent(paymentId)}`;

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
  userNameEl.textContent = user.displayName || "PRAVAAH User";
  userEmailEl.textContent = user.email;
  userPhoto.src = user.photoURL || "default-avatar.png";

  /* Load profile */
  const res = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
  const p = await res.json();
  if (p?.email) {
    userPhoneInput.value = p.phone || "";
    userCollegeInput.value = p.college || "";
    if (p.photo) userPhoto.src = p.photo;
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
    if (!e.target.files.length) return;

    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      userPhoto.src = reader.result;
      const base64 = reader.result.split(",")[1];

      const r = await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          type: "photoUpload",
          email: user.email,
          mimetype: file.type,
          file: base64
        })
      });

      const out = await r.json();
      if (out.ok) {
        userPhoto.src = out.photo;
        showToast("Photo updated!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  /* -------- DRIVE PHOTO UPLOAD -------- */
  driveUploadBtn.onclick = async () => {
    if (!isEditing) return showToast("Tap ✏️ to edit", "info");

    const link = prompt("Paste Google Drive image link");
    const id = link?.match(/[-\w]{25,}/)?.[0];
    if (!id) return showToast("Invalid link", "error");

    const direct = `https://drive.google.com/uc?export=view&id=${id}`;
    userPhoto.src = direct;

    await updateProfile(user, { photoURL: direct });
    await saveProfileToSheet({
      name: user.displayName,
      email: user.email,
      phone: userPhoneInput.value,
      college: userCollegeInput.value,
      photo: direct
    });

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








/* ==========================================================
   PRAVAAH — Profile Management System (Firebase + Apps Script)
========================================================== */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

/* ---------- Firebase ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const storage = getStorage(app);

/* ---------- Backend Script URL (UPDATED) ---------- */
const scriptURL =
  "https://script.google.com/macros/s/AKfycbyc72D1uOGyAaHruVkkdsQpFZJBJ80KvLRpFhWZ0-2VduaaxPWkqt0M0dtYvhDFB_c2jg/exec";

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

/* ---------- Convert ANY Google Drive link to direct image ---------- */
function convertDriveLink(link) {
  const id = link.match(/[-\w]{25,}/)?.[0];
  if (!id) return null;
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

/* ---------- State ---------- */
let isEditing = false;
let originalProfile = { phone: "", college: "" };

function setEditMode(on, ctx) {
  isEditing = on;
  ctx.container?.classList.toggle("is-edit", on);
  ctx.editActions.style.display = on ? "flex" : "none";

  ctx.uploadOptions.style.display = on ? "flex" : "none";
  ctx.userPhoto.style.outline = on ? "2px dashed cyan" : "none";
}

/* ---------- Save profile to Sheets (name/email untouched) ---------- */
async function saveProfileToSheet(profile) {
  const payload = JSON.stringify({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    college: profile.college,
    photo: profile.photo
  });

  try {
    await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload
    });
  } catch (err) {
    console.error("Save failed:", err);
  }
}

/* ---------- Helper ---------- */
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

/* ---------- MAIN ---------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");

  /* ELEMENTS */
  const container = document.querySelector(".profile-container");
  const userPhoto = document.getElementById("userPhoto");
  const uploadPhotoInput = document.getElementById("uploadPhoto");
  const uploadOptions = document.getElementById("uploadOptions");
  const driveUploadBtn = document.getElementById("driveUploadBtn");
  const deviceUploadBtn = document.getElementById("deviceUploadBtn");

  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneInput = document.getElementById("userPhone");
  const userCollegeInput = document.getElementById("userCollege");

  const editPen = document.getElementById("editPen");
  const editActions = document.getElementById("editActions");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");

  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  /* PREFILL BASIC INFO */
  userNameEl.textContent = user.displayName || "PRAVAAH User";
  userEmailEl.textContent = user.email;

  userPhoto.src = "default-avatar.png"; // Override with Sheet pic later

  /* ---------- Load profile from Google Sheet ---------- */
  try {
    const res = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
    const p = await res.json();

    if (p && p.email) {
      userPhoneInput.value = p.phone || "";
      userCollegeInput.value = p.college || "";

      if (p.photo) {
        userPhoto.src = p.photo + `?t=${Date.now()}`;  // Cache bypass
      }
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }

  const phoneSpan = ensureFieldSpan(userPhoneInput, "userPhoneText");
  const collegeSpan = ensureFieldSpan(userCollegeInput, "userCollegeText");

  originalProfile = { phone: userPhoneInput.value, college: userCollegeInput.value };

  /* ---------- Edit Mode ---------- */
  editPen.addEventListener("click", () => {
    setEditMode(!isEditing, { container, uploadOptions, userPhoto, editActions });
  });

  /* ---------- Save ---------- */
  saveBtn.addEventListener("click", async () => {
    await saveProfileToSheet({
      name: user.displayName,
      email: user.email,
      phone: userPhoneInput.value.trim(),
      college: userCollegeInput.value.trim(),
      photo: userPhoto.src.split("?")[0] // remove timestamp
    });

    phoneSpan.textContent = userPhoneInput.value || "-";
    collegeSpan.textContent = userCollegeInput.value || "-";

    showToast("Profile updated!", "success");
    setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  });

  /* ---------- Cancel ---------- */
  cancelBtn.addEventListener("click", () => {
    userPhoneInput.value = originalProfile.phone;
    userCollegeInput.value = originalProfile.college;

    phoneSpan.textContent = originalProfile.phone || "-";
    collegeSpan.textContent = originalProfile.college || "-";

    setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  });

  /* ---------- Upload from Device ---------- */
  deviceUploadBtn.addEventListener("click", () => {
    if (!isEditing) return showToast("Tap ✏️ to edit!", "info");
    uploadPhotoInput.click();
  });

  uploadPhotoInput.addEventListener("change", async (e) => {
    if (!isEditing || !e.target.files?.length) return;

    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (ev) => (userPhoto.src = ev.target.result);
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: url });

      userPhoto.src = url + `?t=${Date.now()}`;

      await saveProfileToSheet({
        name: user.displayName,
        email: user.email,
        phone: userPhoneInput.value,
        college: userCollegeInput.value,
        photo: url
      });

      showToast("Photo updated!", "success");
    } catch (err) {
      console.error(err);
      showToast("Upload failed!", "error");
    }
  });

  /* ---------- Upload from Drive ---------- */
  driveUploadBtn.addEventListener("click", async () => {
    if (!isEditing) return;

    const link = prompt("Paste Google Drive image link:");
    const directURL = convertDriveLink(link);

    if (!directURL) return showToast("Invalid Google Drive link!", "error");

    await updateProfile(user, { photoURL: directURL });

    userPhoto.src = directURL + `?t=${Date.now()}`;

    await saveProfileToSheet({
      name: user.displayName,
      email: user.email,
      phone: userPhoneInput.value,
      college: userCollegeInput.value,
      photo: directURL
    });

    showToast("Photo updated!", "success");
  });

  /* ---------- Logout ---------- */
  const logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
  };
  logoutDesktop.addEventListener("click", logout);
  logoutMobile.addEventListener("click", logout);
});


/* ---------- Toast CSS ---------- */
const style = document.createElement("style");
style.innerHTML = `
.toast {
  position: fixed; bottom: 30px; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.85);
  padding: 12px 25px; color: cyan;
  border: 1px solid cyan; border-radius: 25px;
  opacity: 0; transition: .4s;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(-10px); }
.toast.success { color: #00ffcc; border-color: #00ffcc; }
.toast.error { color: #ff8888; border-color: #ff5555; }
`;
document.head.appendChild(style);

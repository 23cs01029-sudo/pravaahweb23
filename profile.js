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

/* ---------- Backend Script URL ---------- */
const scriptURL = "https://script.google.com/macros/s/AKfycbxq-IkyZ9Jr23G4Z9RKUYm65iviYSX-RMw7BxElg41Y-u3a1pTclAk6UpN_yMD6qn6xHQ/exec";

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
  ctx.container?.classList.toggle("is-edit", on);
  if (ctx.editActions) ctx.editActions.style.display = on ? "flex" : "none";

  if (ctx.uploadOptions) {
    if (on) {
      ctx.uploadOptions.classList.remove("hidden");
      ctx.uploadOptions.style.display = "flex";
    } else {
      ctx.uploadOptions.classList.add("hidden");
      ctx.uploadOptions.style.display = "none";
    }
  }

  if (ctx.userPhoto) {
    ctx.userPhoto.style.outline = on ? "2px dashed cyan" : "none";
    ctx.userPhoto.style.outlineOffset = "6px";
  }
}

/* ---------- Save to Sheets ---------- */
async function saveProfileToSheet(profile) {
  const payload = JSON.stringify({
    name: profile.name?.trim() || "",
    email: profile.email?.trim().toLowerCase() || "",
    phone: profile.phone || "",
    college: profile.college || "",
    photo: profile.photo || ""
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain" });
      navigator.sendBeacon(scriptURL, blob);
    } else {
      await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload
      });
    }
  } catch (err) {
    console.error("Save failed:", err);
  }
}

/* ---------- Ensure span next to field ---------- */
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

  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  /* Prefill */
  userNameEl.textContent = user.displayName || "PRAVAAH User";
  userEmailEl.textContent = user.email;
  userPhoto.src = user.photoURL || "default-avatar.png";

  /* Profile fetch */
  try {
    const res = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
    const p = await res.json();

    if (p && p.email) {
      userPhoneInput.value = p.phone || "";
      userCollegeInput.value = p.college || "";
      localStorage.setItem("profileData", JSON.stringify(p));
    } else {
      const newP = { name: user.displayName, email: user.email, phone: "", college: "" };
      await saveProfileToSheet(newP);
      localStorage.setItem("profileData", JSON.stringify(newP));
    }
  } catch (e) {
    console.error("Profile load failed:", e);
  }

  const phoneSpan = ensureFieldSpan(userPhoneInput, "userPhoneText");
  const collegeSpan = ensureFieldSpan(userCollegeInput, "userCollegeText");

  originalProfile = {
    phone: userPhoneInput.value,
    college: userCollegeInput.value
  };

  /* Edit Pen */
  let editPen = document.getElementById("editPen");
  if (!editPen) {
    editPen = document.createElement("button");
    editPen.id = "editPen";
    editPen.className = "edit-pen";
    editPen.innerHTML = `<i class="fa-solid fa-pen"></i>`;
    document.querySelector(".photo-wrapper").appendChild(editPen);
  }

  /* Save & Cancel Buttons */
  let editActions = document.getElementById("editActions");
  if (!editActions) {
    editActions = document.createElement("div");
    editActions.id = "editActions";
    editActions.className = "edit-actions";
    editActions.innerHTML = `
      <button id="saveProfileBtn" class="save-btn">Save</button>
      <button id="cancelEditBtn" class="save-btn secondary">Cancel</button>
    `;
    document.querySelector(".profile-info").appendChild(editActions);
  }

  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");

  /* Edit Mode */
  editPen.addEventListener("click", () => {
    if (!isEditing) {
      originalProfile = {
        phone: userPhoneInput.value,
        college: userCollegeInput.value
      };
    }
    setEditMode(!isEditing, { container, uploadOptions, userPhoto, editActions });
  });

  /* Save */
  saveBtn.addEventListener("click", async () => {
    const phone = userPhoneInput.value.trim();
    const college = userCollegeInput.value.trim();

    await saveProfileToSheet({ name: user.displayName, email: user.email, phone, college });

    phoneSpan.textContent = phone || "-";
    collegeSpan.textContent = college || "-";

    localStorage.setItem(
      "profileData",
      JSON.stringify({ name: user.displayName, email: user.email, phone, college })
    );

    showToast("Profile updated!", "success");
    setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  });

  /* Cancel */
  cancelBtn.addEventListener("click", () => {
    userPhoneInput.value = originalProfile.phone;
    userCollegeInput.value = originalProfile.college;

    phoneSpan.textContent = originalProfile.phone || "-";
    collegeSpan.textContent = originalProfile.college || "-";

    setEditMode(false, { container, uploadOptions, userPhoto, editActions });
  });

  /* Upload From Device Button */
  if (uploadOptions && !document.getElementById("deviceUploadBtn")) {
    const btn = document.createElement("button");
    btn.id = "deviceUploadBtn";
    btn.className = "upload-btn";
    btn.innerHTML = `<i class="fa-solid fa-desktop"></i> Upload from Device`;
    uploadOptions.prepend(btn);

    btn.addEventListener("click", () => {
      if (!isEditing) return showToast("Tap ✏️ to edit!", "info");
      uploadPhotoInput.click();
    });
  }

  /* Device Upload Handler — FINAL FIXED VERSION */
  uploadPhotoInput.addEventListener("change", async (e) => {
    if (!isEditing) return showToast("Tap ✏️ to edit!", "info");

    uploadOptions.classList.add("hidden");
    uploadOptions.style.display = "none";

    if (!e.target.files || e.target.files.length === 0) {
      showToast("No file selected.", "info");
      return;
    }

    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (ev) => (userPhoto.src = ev.target.result);
    reader.readAsDataURL(file);

    try {
      showToast("Uploading...", "info");

      const storageRef = ref(storage, `profilePhotos/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: url });
      userPhoto.src = url;

      await saveProfileToSheet({
        name: auth.currentUser.displayName,
        email: auth.currentUser.email,
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

  /* Drive Upload */
  driveUploadBtn.addEventListener("click", async () => {
    if (!isEditing) return showToast("Tap ✏️ to edit!", "info");

    uploadOptions.classList.add("hidden");
    uploadOptions.style.display = "none";

    const link = prompt("Paste Google Drive image link:");
    if (!link || !link.includes("drive.google.com"))
      return showToast("Invalid link!", "error");

    const id = link.match(/[-\w]{25,}/);
    if (!id) return showToast("Invalid link format!", "error");

    const direct = `https://drive.google.com/uc?export=view&id=${id[0]}`;

    try {
      await updateProfile(auth.currentUser, { photoURL: direct });
      userPhoto.src = direct;

      await saveProfileToSheet({
        name: auth.currentUser.displayName,
        email: auth.currentUser.email,
        phone: userPhoneInput.value,
        college: userCollegeInput.value,
        photo: direct
      });

      showToast("Photo updated!", "success");
    } catch {
      showToast("Failed to use this image.", "error");
    }
  });

  /* Logout */
  const logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
  };
  logoutDesktop.addEventListener("click", logout);
  logoutMobile.addEventListener("click", logout);
});

/* ---------- Inject Toast CSS ---------- */
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

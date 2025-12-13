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
    ctx.uploadOptions.classList.toggle("hidden", !on);
    ctx.uploadOptions.style.display = on ? "flex" : "none";
  }
  if (ctx.userPhoto) {
    ctx.userPhoto.style.outline = on ? "2px dashed cyan" : "none";
    ctx.userPhoto.style.outlineOffset = "6px";
  }
}

/* ---------- Save to Sheet ---------- */
async function saveProfileToSheet(profile) {
  const payload = JSON.stringify({
    name: (profile.name || "").trim(),
    email: (profile.email || "").trim().toLowerCase(),
    phone: profile.phone || "",
    college: profile.college || "",
    photo: profile.photo || ""
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain" }); // text/plain avoids CORS preflight
      navigator.sendBeacon(scriptURL, blob);
    } else {
      await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload
      });
    }
  } catch (err) {
    console.error("⚠️ Failed to save profile:", err);
  }
}

/* ---------- Helper: ensure span next to input ---------- */
function ensureFieldSpan(inputEl, spanId) {
  let span = document.getElementById(spanId);
  if (!span) {
    span = document.createElement("span");
    span.id = spanId;
    span.className = "field-text";
    inputEl.insertAdjacentElement("afterend", span);
  }
  span.textContent = (inputEl.value || "").trim() || "-";
  return span;
}

/* ---------- Auto-grow textareas (vertical, not wide) ---------- */
function bindAutoGrow() {
  const grow = (t) => {
    t.style.height = "auto";
    t.style.height = t.scrollHeight + "px";
  };
  document.querySelectorAll("textarea.auto-grow").forEach((t) => {
    t.style.overflow = "hidden";
    grow(t);
    t.addEventListener("input", () => grow(t));
  });
}

/* ---------- Main ---------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  /* Elements */
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

  /* Edit Pen (ensure exists) */
  let editPen = document.getElementById("editPen");
  if (!editPen) {
    editPen = document.createElement("button");
    editPen.id = "editPen";
    editPen.className = "edit-pen";
    editPen.innerHTML = `<i class="fa-solid fa-pen"></i>`;
    document.querySelector(".photo-wrapper")?.appendChild(editPen);
  }

  /* Save/Cancel (ensure exists) */
  let editActions = document.getElementById("editActions");
  if (!editActions) {
    editActions = document.createElement("div");
    editActions.id = "editActions";
    editActions.className = "edit-actions";
    editActions.innerHTML = `
      <button id="saveProfileBtn" class="save-btn">Save</button>
      <button id="cancelEditBtn" class="save-btn secondary">Cancel</button>
    `;
    document.querySelector(".profile-info")?.appendChild(editActions);
  }
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");

  /* Prefill (from Firebase) */
  userEmailEl.textContent = user.email;
  userNameEl.textContent = user.displayName || "PRAVAAH User";
  userPhoto.src = user.photoURL || "default-avatar.png";

  userPhoneInput.disabled = false;
  userCollegeInput.disabled = false;

  passesList.innerHTML = `<p class="no-passes">⏳ Loading your passes...</p>`;

  /* Fetch profile from backend (Profiles file) */
  try {
    const profileRes = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
    const profileData = await profileRes.json();

    if (profileData && (profileData.name || profileData.email)) {
      userPhoneInput.value = profileData.phone || "";
      userCollegeInput.value = profileData.college || "";
      localStorage.setItem("profileData", JSON.stringify(profileData));
    } else {
      const newProfile = {
        name: user.displayName || "PRAVAAH User",
        email: user.email,
        phone: "",
        college: ""
      };
      await saveProfileToSheet(newProfile);
      localStorage.setItem("profileData", JSON.stringify(newProfile));
    }
  } catch (err) {
    console.error("⚠️ Error fetching profile:", err);
  }

  /* Sync display spans */
  const phoneSpan = ensureFieldSpan(userPhoneInput, "userPhoneText");
  const collegeSpan = ensureFieldSpan(userCollegeInput, "userCollegeText");

  originalProfile = {
    phone: userPhoneInput.value,
    college: userCollegeInput.value
  };

  /* Bind autosize after prefill */
  bindAutoGrow();

  /* Edit toggle */
  editPen.addEventListener("click", () => {
    if (!isEditing) {
      originalProfile = {
        phone: userPhoneInput.value,
        college: userCollegeInput.value
      };
    }
    setEditMode(!isEditing, { container, userPhoneInput, userCollegeInput, uploadOptions, userPhoto, editActions });
  });

  /* Save */
  saveBtn.addEventListener("click", async () => {
    const phone = userPhoneInput.value.trim();
    const college = userCollegeInput.value.trim();

    try {
      await saveProfileToSheet({ name: user.displayName, email: user.email, phone, college });
      phoneSpan.textContent = phone || "-";
      collegeSpan.textContent = college || "-";
      localStorage.setItem("profileData", JSON.stringify({ name: user.displayName, email: user.email, phone, college }));
      showToast("✅ Profile updated successfully!", "success");
      setEditMode(false, { container, userPhoneInput, userCollegeInput, uploadOptions, userPhoto, editActions });
    } catch (err) {
      console.error("⚠️ Save failed:", err);
      showToast("❌ Failed to save changes.", "error");
    }
  });

  /* Cancel */
  cancelBtn.addEventListener("click", () => {
    userPhoneInput.value = originalProfile.phone;
    userCollegeInput.value = originalProfile.college;
    phoneSpan.textContent = originalProfile.phone || "-";
    collegeSpan.textContent = originalProfile.college || "-";
    setEditMode(false, { container, userPhoneInput, userCollegeInput, uploadOptions, userPhoto, editActions });
    bindAutoGrow(); // reflow heights after reset
  });

  /* Photo click toggles options in edit mode */
  userPhoto.addEventListener("click", () => {
    if (!isEditing) return showToast("Tap the ✏️ pen to edit your profile.", "info");
    uploadOptions.classList.toggle("hidden");
    uploadOptions.style.display = uploadOptions.classList.contains("hidden") ? "none" : "flex";
  });

  /* Upload from Device (ensure button) */
  if (uploadOptions && !document.getElementById("deviceUploadBtn")) {
    const deviceBtn = document.createElement("button");
    deviceBtn.id = "deviceUploadBtn";
    deviceBtn.className = "upload-btn";
    deviceBtn.innerHTML = `<i class="fa-solid fa-desktop"></i> Upload from Device`;
    uploadOptions.prepend(deviceBtn);
    deviceBtn.addEventListener("click", () => {
      if (!isEditing) return showToast("Tap the ✏️ pen to start editing.", "info");
      uploadPhotoInput.click();
      uploadOptions.classList.add("hidden");
      uploadOptions.style.display = "none";
    });
  }

  /* Device upload handler */
  uploadPhotoInput.addEventListener("change", async (e) => {
    if (!isEditing) return showToast("Tap the ✏️ pen to start editing.", "info");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => (userPhoto.src = ev.target.result);
    reader.readAsDataURL(file);

    try {
      showToast("📸 Uploading photo...", "info");
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      userPhoto.src = photoURL;

      await saveProfileToSheet({
        name: user.displayName,
        email: user.email,
        phone: userPhoneInput.value,
        college: userCollegeInput.value,
        photo: photoURL
      });

      showToast("✅ Profile photo updated!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      showToast("❌ Upload failed. Try again.", "error");
    }
  });

  /* Upload from Google Drive */
  driveUploadBtn.addEventListener("click", async () => {
    if (!isEditing) return showToast("Tap the ✏️ pen to start editing.", "info");
    uploadOptions.classList.add("hidden");
    uploadOptions.style.display = "none";

    const driveLink = prompt("📂 Paste your Google Drive image link:");
    if (!driveLink || !driveLink.includes("https://drive.google.com"))
      return showToast("⚠️ Invalid Google Drive link.", "error");

    const fileIdMatch = driveLink.match(/[-\w]{25,}/);
    if (!fileIdMatch) return showToast("⚠️ Invalid link format.", "error");

    const directLink = `https://drive.google.com/uc?export=view&id=${fileIdMatch[0]}`;

    try {
      await updateProfile(user, { photoURL: directLink });
      userPhoto.src = directLink;
      await saveProfileToSheet({
        name: user.displayName,
        email: user.email,
        phone: userPhoneInput.value,
        college: userCollegeInput.value,
        photo: directLink
      });
      showToast("✅ Profile photo updated from Drive!", "success");
    } catch (err) {
      console.error("Drive update error:", err);
      showToast("❌ Failed to set photo.", "error");
    }
  });

  /* Fetch passes (GET ?email=...) */
  try {
    const res = await fetch(`${scriptURL}?email=${encodeURIComponent(user.email)}`);
    const passes = await res.json();

    if (!passesList) return;

    if (!passes || passes.length === 0) {
      passesList.innerHTML = `<p class="no-passes">❌ No passes yet. Not registered.</p>`;
      return;
    }

    const grouped = {};
    passes.forEach((p) => {
      if (!grouped[p.paymentId]) grouped[p.paymentId] = [];
      grouped[p.paymentId].push(p);
    });

    passesList.innerHTML = Object.entries(grouped)
      .map(
        ([paymentId, items]) => `
          <div class="pass-item">
            <h3>${items[0].passType}</h3>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Total Amount:</strong> ₹${items[0].totalAmount}</p>
            <p><strong>Participants:</strong></p>
            <ul>
              ${items.map((p) => `<li>${p.name} (${p.email}, ${p.phone || "-"}) — ${p.college || "-"}</li>`).join("")}
            </ul>
          </div>
        `
      )
      .join("");
  } catch (err) {
    console.error("❌ Error fetching passes:", err);
  }

  /* Logout */
  const logout = async () => {
    try {
      await signOut(auth);
      showToast("👋 Logged out successfully!", "success");
      setTimeout(() => (window.location.href = "index.html"), 1200);
    } catch (e) {
      showToast("❌ Logout failed.", "error");
    }
  };
  logoutDesktop?.addEventListener("click", logout);
  logoutMobile?.addEventListener("click", logout);
});

/* ---------- Inject Toast CSS ---------- */
const style = document.createElement("style");
style.innerHTML = `
.toast {
  position: fixed; bottom: 30px; left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(0, 0, 0, 0.85); color: white;
  padding: 12px 25px; border-radius: 25px;
  font-family: 'Exo 2', sans-serif;font-size: 0.95rem;
  opacity: 0; pointer-events: none; transition: all 0.4s ease;
  z-index: 9999; border: 1px solid cyan; box-shadow: 0 0 15px rgba(0,255,255,0.5);
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.success { border-color: #00ff99; color: #00ffcc; }
.toast.error   { border-color: #ff5555; color: #ff8888; }
.toast.info    { border-color: cyan; color: cyan; }
`;
document.head.appendChild(style);






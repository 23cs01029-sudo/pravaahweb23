const SESSION_KEY = "pravaah_payment";
const SCRIPT_URL = "/api/pravaah";

/* 🔐 UPI DETAILS */
const UPI_ID = "8074412679@ybl";
const RECEIVER_NAME = "KANDULA JOJI KUMAR";
const RECEIVER_KEYWORDS = ["KANDULA", "JOJI", "KUMAR"];

/* ================= SESSION ================= */
const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");

// ❌ No session → go home
if (!session.sessionId) {
  window.location.replace("home.html");
}

/* ⏰ AUTO EXPIRE AT DAY END */
const now = new Date();
const end = new Date();
end.setHours(23, 59, 59, 999);

if (now > end) {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("home.html");
}

/* ================= PAGE LOCK ================= */
let allowExit = false;
window.addEventListener("beforeunload", (e) => {
  if (!allowExit) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ================= DISPLAY INFO ================= */
const amount = session.totalAmount;

document.getElementById("sessionInfo").innerHTML = `
  <p><b>Pass:</b> ${session.passType}</p>
  <p><b>Amount:</b> ₹${amount}</p>
`;

/* ================= DYNAMIC UPI LINK ================= */
const upiLink =
  `upi://pay?pa=${UPI_ID}` +
  `&pn=${encodeURIComponent(RECEIVER_NAME)}` +
  `&am=${amount}` +
  `&cu=INR` +
  `&tn=PRAVAAH_${session.sessionId}`;

/* ================= QR ================= */
new QRCode(document.getElementById("qrBox"), {
  text: upiLink,
  width: 240,
  height: 240
});

/* ================= PAY USING APP BUTTON ================= */
const upiPayBtn = document.getElementById("upiPayBtn");
if (upiPayBtn) {
  upiPayBtn.href = upiLink;
}

/* ================= OCR & UPLOAD ================= */
const fileInput = document.getElementById("screenshot");
const confirmBtn = document.getElementById("confirmBtn");
const fileNameEl = document.getElementById("fileName");
const uploadStatusEl = document.getElementById("uploadStatus");

let extractedUTR = null;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  // 🔒 Allow ONLY one image
  if (fileInput.files.length > 1) {
    alert("Please upload only one screenshot.");
    fileInput.value = "";
    return;
  }

  extractedUTR = null;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Processing…";

  fileNameEl.textContent = file.name;
  uploadStatusEl.textContent = "⏳ Processing screenshot…";
  uploadStatusEl.style.color = "#ffd36a";

  try {
    const { data } = await Tesseract.recognize(file, "eng");
    const text = data.text.toUpperCase();

    /* 🔢 UTR (12–16 digits) */
    const utrMatch = text.match(/\b\d{12,16}\b/);

    /* 💰 Amount check */
    const cleanText = text.replace(/[,₹RSINR]/g, "");
    const amountOk = new RegExp(`\\b${amount}(\\.00)?\\b`).test(cleanText);

    /* 👤 Receiver name */
    const receiverOk = RECEIVER_KEYWORDS.some(k => text.includes(k));

    if (utrMatch && amountOk && receiverOk) {
      extractedUTR = utrMatch[0];
      confirmBtn.disabled = false;
      uploadStatusEl.textContent = "✅ Screenshot verified";
      uploadStatusEl.style.color = "#4cff88";
    } else {
      uploadStatusEl.textContent = "❌ Verification failed";
      uploadStatusEl.style.color = "#ff5c5c";
      alert(
        "Could not verify payment.\n\n" +
        "Make sure screenshot shows:\n" +
        "• UTR\n" +
        "• Amount ₹" + amount + "\n" +
        "• Receiver name"
      );
    }

  } catch (err) {
    console.error(err);
    uploadStatusEl.textContent = "❌ Processing failed";
    uploadStatusEl.style.color = "#ff5c5c";
    alert("Screenshot processing failed. Please try again.");
  }

  confirmBtn.textContent = "Confirm Payment";
});

/* ================= CONFIRM PAYMENT ================= */
confirmBtn.onclick = async () => {
  if (!extractedUTR) {
    alert("Please upload a valid payment screenshot.");
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Confirming…";

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "UPI_PAYMENT_CONFIRM",
        utr: extractedUTR,
        session
      })
    });

    const out = await res.json();

    if (out.ok) {
      allowExit = true;
      localStorage.removeItem(SESSION_KEY);
      window.location.replace("payment_success.html");
    } else {
      throw new Error(out.error || "Payment validation failed");
    }
  } catch (err) {
    alert(err.message);
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Payment";
  }
};

/* ================= CANCEL PAYMENT ================= */
document.getElementById("cancelBtn").onclick = () => {
  allowExit = true;
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("registrationPravaah.html");
};
const payerUpiInput = document.getElementById("payerUpi");
const sendRequestBtn = document.getElementById("sendRequestBtn");

if (sendRequestBtn) {
  sendRequestBtn.onclick = () => {
    const payerUpi = payerUpiInput.value.trim();

    if (!payerUpi || !payerUpi.includes("@")) {
      alert("Please enter a valid UPI ID (example: name@upi)");
      return;
    }

    // UPI COLLECT (Request to Pay)
    const collectLink =
      `upi://pay?pa=${UPI_ID}` +
      `&pn=${encodeURIComponent(RECEIVER_NAME)}` +
      `&am=${amount}` +
      `&cu=INR` +
      `&tn=PRAVAAH_${session.sessionId}` +
      `&tr=${session.sessionId}` +
      `&mode=02`; // 👈 02 = Collect Request

    // Open UPI app with request
    window.location.href = collectLink;

    alert("Payment request sent to " + payerUpi);
  };
}

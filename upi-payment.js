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

/* ================= PAGE LOCK CONTROL ================= */
let allowExit = false;

window.addEventListener("beforeunload", e => {
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

/* ================= DYNAMIC UPI QR ================= */
const upiLink =
  `upi://pay?pa=${UPI_ID}` +
  `&pn=${encodeURIComponent(RECEIVER_NAME)}` +
  `&am=${amount}` +
  `&cu=INR` +
  `&tn=PRAVAAH_PASS`;

new QRCode(document.getElementById("qrBox"), {
  text: upiLink,
  width: 240,
  height: 240
});

/* ================= OCR ================= */
const fileInput = document.getElementById("screenshot");
const confirmBtn = document.getElementById("confirmBtn");
const fileNameEl = document.getElementById("fileName");

let extractedUTR = null;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  extractedUTR = null;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Processing screenshot…";

  if (fileNameEl) fileNameEl.textContent = file.name;

  try {
    const { data } = await Tesseract.recognize(file, "eng");
    const text = data.text.toUpperCase();

    /* 🔢 UTR (12–16 digits) */
    const utrMatch = text.match(/\b\d{12,16}\b/);

    /* 💰 Amount (robust) */
    const cleanText = text.replace(/[,₹RSINR]/g, "");
    const amountRegex = new RegExp(`\\b${amount}(\\.00)?\\b`);
    const amountOk = amountRegex.test(cleanText);

    /* 👤 Receiver */
    const receiverOk = RECEIVER_KEYWORDS.some(k => text.includes(k));

    if (utrMatch && amountOk && receiverOk) {
      extractedUTR = utrMatch[0];
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Payment";
    } else {
      confirmBtn.textContent = "Confirm Payment";
      alert(
        "Unable to verify payment from screenshot.\n\n" +
        "Please ensure:\n" +
        "• UTR is visible\n" +
        "• Amount is ₹" + amount + "\n" +
        "• Receiver name is visible"
      );
    }

  } catch (err) {
    console.error(err);
    confirmBtn.textContent = "Confirm Payment";
    alert("Failed to process screenshot. Please try again.");
  }
});

/* ================= CONFIRM PAYMENT ================= */
confirmBtn.onclick = async () => {
  if (!extractedUTR) {
    alert("UTR not detected. Please upload a valid screenshot.");
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Confirming…";

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
    window.location.replace("payment-success.html");
  } else {
    alert(out.error || "Payment validation failed");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Payment";
  }
};

/* ================= CANCEL PAYMENT ================= */
document.getElementById("cancelBtn").onclick = () => {
  allowExit = true;
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("events.html");
};

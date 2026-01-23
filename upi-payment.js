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

/* 🔒 PAGE LOCK */
window.addEventListener("beforeunload", e => {
  e.preventDefault();
  e.returnValue = "";
});

/* ================= DISPLAY INFO ================= */
// ✅ FIX: use totalAmount
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

/* ================= OCR (HIDDEN) ================= */
const fileInput = document.getElementById("screenshot");
const confirmBtn = document.getElementById("confirmBtn");

let extractedUTR = null;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  confirmBtn.disabled = true;

  try {
    const { data } = await Tesseract.recognize(file, "eng");
    const text = data.text.toUpperCase();

    /* 🔢 UTR */
    const utrMatch = text.match(/\b\d{12}\b/);

    /* 💰 Amount (best effort) */
    const amountOk = text.includes(String(amount));

    /* 👤 Receiver (keyword match) */
    const receiverOk = RECEIVER_KEYWORDS.some(k => text.includes(k));

    if (utrMatch && amountOk && receiverOk) {
      extractedUTR = utrMatch[0];
      confirmBtn.disabled = false; // ✅ allow backend to decide finally
    } else {
      alert(
        "Unable to verify payment from screenshot.\n" +
        "Please upload a clear screenshot showing UTR, amount, and receiver name."
      );
    }

  } catch (err) {
    console.error(err);
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
    localStorage.removeItem(SESSION_KEY);
    window.location.replace("payment-success.html");
  } else {
    alert(out.error || "Payment validation failed");
    confirmBtn.disabled = false;
  }
};

/* ================= CANCEL PAYMENT ================= */
document.getElementById("cancelBtn").onclick = () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("events.html");
};

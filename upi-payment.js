const SESSION_KEY = "pravaah_payment";
const SCRIPT_URL = "/api/pravaah";

// 🔐 UPI DETAILS (LOCKED)
const UPI_ID = "8074412679@ybl";
const RECEIVER_NAME = "KANDULA JOJI KUMAR";
const RECEIVER_KEYWORDS = ["KANDULA", "JOJI", "KUMAR"];

const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");

// ❌ No session → go home
if (!session.sessionId) {
  window.location.replace("home.html");
}

// 🔒 LOCK PAGE (cannot exit casually)
window.addEventListener("beforeunload", e => {
  e.preventDefault();
  e.returnValue = "";
});

// ⏰ Auto-expire at day end
const now = new Date();
const end = new Date();
end.setHours(23, 59, 59, 999);

if (now > end) {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("home.html");
}

// 🧾 Show info
document.getElementById("sessionInfo").innerHTML = `
  <p><b>Pass:</b> ${session.passType}</p>
  <p><b>Amount:</b> ₹${session.amount}</p>
`;

// 🔗 Dynamic UPI link
const upiLink =
  `upi://pay?pa=${UPI_ID}` +
  `&pn=${encodeURIComponent(RECEIVER_NAME)}` +
  `&am=${session.amount}` +
  `&cu=INR` +
  `&tn=PRAVAAH_PASS`;

// 📷 QR
new QRCode(document.getElementById("qrBox"), {
  text: upiLink,
  width: 220,
  height: 220
});

// OCR + validation
const fileInput = document.getElementById("screenshot");
const confirmBtn = document.getElementById("confirmBtn");

let validUTR = false;
let validAmount = false;
let validReceiver = false;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  confirmBtn.disabled = true;

  const { data } = await Tesseract.recognize(file, "eng");
  const text = data.text.toUpperCase();

  // 🔢 UTR
  const utrMatch = text.match(/\b\d{12}\b/);
  if (utrMatch) {
    document.getElementById("utr").value = utrMatch[0];
    validUTR = true;
  }

  // 💰 Amount
  const amtMatch = text.match(/₹\s?(\d+)/);
  if (amtMatch && Number(amtMatch[1]) === session.amount) {
    document.getElementById("amountDetected").value = amtMatch[1];
    validAmount = true;
  }

  // 👤 Receiver
  validReceiver = RECEIVER_KEYWORDS.some(k => text.includes(k));
  document.getElementById("receiver").value =
    validReceiver ? "MATCHED" : "NOT MATCHED";

  // ✅ Enable confirm only if ALL valid
  if (validUTR && validAmount && validReceiver) {
    confirmBtn.disabled = false;
  }
});

// ✅ Confirm payment
confirmBtn.onclick = async () => {
  confirmBtn.disabled = true;

  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "UPI_PAYMENT_CONFIRM",
      session,
      utr: document.getElementById("utr").value
    })
  });

  const out = await res.json();
  if (out.ok) {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace("payment_success.html");
  } else {
    alert(out.error || "Payment validation failed");
    confirmBtn.disabled = false;
  }
};

// ❌ Cancel payment
document.getElementById("cancelBtn").onclick = () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("events.html");
};

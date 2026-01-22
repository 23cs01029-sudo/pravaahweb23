payBtn.addEventListener("click", async () => {
  if (paying) return;
  paying = true;

  const numInputLocal = document.getElementById("numParticipants");
  if (!numInputLocal) {
    alert("Please select pass and number of participants first.");
    paying = false;
    return;
  }

  participantsCount = parseInt(numInputLocal.value) || 0;
  if (participantsCount <= 0) {
    alert("Please add at least 1 participant.");
    paying = false;
    return;
  }

  const cards = [...document.querySelectorAll("#participantsContainerPlaceholder .participant-card")];
  const participants = cards.map(c => ({
    name: c.querySelector(".pname")?.value.trim(),
    email: c.querySelector(".pemail")?.value.trim(),
    phone: c.querySelector(".pphone")?.value.trim(),
    college: c.querySelector(".pcollege")?.value.trim()
  }));

  for (let p of participants) {
    if (!p.name || !p.email || !p.phone || !p.college) {
      alert("Fill all participant fields.");
      paying = false;
      return;
    }
  }

  /* 🔐 CREATE PAYMENT SESSION */
  const paymentSession = {
    sessionId: crypto.randomUUID(),
    createdAt: Date.now(),
    expiresAt: new Date().setHours(23,59,59,999),

    registeredEmail: auth.currentUser.email,
    passType: currentPassType,
    totalAmount: currentTotal,

    participants,
    daySelected: currentDayPassDays,
    visitorDays: currentVisitorDays,
    starnite: includeStarNite,
    events: collectSelectedEvents()
  };

  // 💾 Save session locally
  localStorage.setItem(
    "pravaah_payment",
    JSON.stringify(paymentSession)
  );

  // ➡️ Redirect to UPI page
  window.location.href = "upi-payment.html";
});

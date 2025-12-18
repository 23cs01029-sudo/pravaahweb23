export default async function handler(req, res) {
  try {
    const GAS_URL =
      "https://script.google.com/macros/s/AKfycbygs9kgApNE4L_vLLoyxkcaMvRm25iI6gOyX9-FPUYjDV3V8u6Rt4tfMX4-PJPW2e9IKg/exec";

    let url = GAS_URL;

    if (req.method === "GET") {
      const qs = new URLSearchParams(req.query).toString();
      if (qs) url += "?" + qs;
    }

    const gasRes = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined
    });

    const text = await gasRes.text();
    res.status(200).send(text);

  } catch (e) {
    res.status(500).json({ error: "Proxy failed", details: e.message });
  }
}

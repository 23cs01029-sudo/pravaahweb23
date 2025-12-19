export default async function handler(req, res) {
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbyOUaWbQgD1nx2MyB1RRfY9R3lbOlRg1jDDcAhTajOTve44yJef_3LIuQqGVim8N4T0nA/exec";

  try {
    // ✅ Allow only GET & POST
    if (!["GET", "POST"].includes(req.method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let url = GAS_URL;

    // ✅ Forward query params
    if (req.method === "GET" && Object.keys(req.query).length) {
      const qs = new URLSearchParams(req.query).toString();
      url += "?" + qs;
    }

    // ✅ Timeout protection
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000);

    const gasRes = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    });

    const text = await gasRes.text();

    // ✅ Forward correct content type
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(text);

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({
      ok: false,
      error: "Proxy failed",
      details: err.message
    });
  }
}

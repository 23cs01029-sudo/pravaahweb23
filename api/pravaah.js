// /api/pravaah.js
export default async function handler(req, res) {
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbyVo8D7KxauDBHl3ErJt_E97trRoQU2-0LNN8rFyjCpogy2Jwdgsk1PwrtmZyE7O6Up/exec";

  try {
    // ✅ Allow only GET & POST
    if (!["GET", "POST"].includes(req.method)) {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    let url = GAS_URL;

    // ✅ Forward query params for GET
    if (req.method === "GET" && Object.keys(req.query).length) {
      const qs = new URLSearchParams(req.query).toString();
      url += "?" + qs;
    }

    // ✅ Abort if GAS is slow
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const gasRes = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await gasRes.text();

    // ✅ Forward response as-is
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(text);

  } catch (err) {
    console.error("PRAVAAH Proxy Error:", err);

    return res.status(500).json({
      ok: false,
      error: "Proxy failed",
      details: err.message
    });
  }
}

export default async function handler(req, res) {
  try {
    const GAS_URL =
      "https://script.google.com/macros/s/AKfycbxXKrd2v9b1Dw3ZoodGweYLa5tDR3rYZqVXhLVOmdmZPEJW8MWSdnVKxJRyNIabVUneFg/exec";

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

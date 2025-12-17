export default async function handler(req, res) {
  try {
    const qs = new URLSearchParams(req.query).toString();

    const url =
      "https://script.google.com/macros/s/AKfycbxA4kUMYAaDE-HP07EWZa5Nm8pWYqUvUO-WzxkUoR3jXRjqPOvJ9Rv91P8glYNLJfMjrw/exec?" +
      qs;

    const r = await fetch(url);
    const text = await r.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: "Proxy failed" });
  }
}

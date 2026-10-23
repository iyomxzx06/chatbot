// Vercel serverless function: runs at /api/chat
// The secret key lives in Vercel Environment Variables, never in the browser.

const MODEL = "gemini-3.8-flash"; // model id shown in Google AI Studio

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages" });
  }

  // Convert our chat history to Gemini's format (keep the last 20 messages)
  const contents = messages.slice(-20).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text).slice(0, 2000) }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are a friendly, helpful assistant. Reply briefly and clearly." }],
          },
          contents,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || "Gemini error" });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Walang sagot, subukan ulit.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

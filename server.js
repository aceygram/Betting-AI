import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend from /public folder
app.use(express.static("public"));

// ================= API-FOOTBALL =================
app.get("/api/football", async (req, res) => {
  const { endpoint, ...params } = req.query; // separate endpoint from all other params

  try {
    const url = new URL(`https://v3.football.api-sports.io${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v)); // forward search, season, etc.

    const response = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": process.env.FOOTBALL_API_KEY
      }
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      res.status(500).json({ error: "Invalid API response", raw: text });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= AI (Groq) =================
app.post("/api/claude", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data).slice(0, 200));

    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "Empty AI response" });

    res.json({ content: [{ type: "text", text: content }] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
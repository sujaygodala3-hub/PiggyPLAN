import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/insights", async (req, res) => {
  try {
    const { question, context } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Missing 'question'." });
    }

    const money = Number(context?.money ?? 0);
    const daysPlayed = Number(context?.daysPlayed ?? 0);
    const ownedAccessories = context?.ownedAccessories ?? {};
    const equippedAccessories = context?.equippedAccessories ?? {};

    const system = `You are FinWise's Money Insighter.
Give practical, student-friendly saving advice.
Be concise, specific, and actionable.
Avoid medical/legal claims.`;

    const user = `Question: ${question}

Game context:
- Money: $${money}
- Days played: ${daysPlayed}
- Owned accessories: ${JSON.stringify(ownedAccessories)}
- Equipped accessories: ${JSON.stringify(equippedAccessories)}

Answer with:
1) Direct answer (2-4 bullets)
2) One "next step" mission for the player`;

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    // responses API returns output_text convenience
    const text = resp.output_text || "I couldn't generate an answer this time.";
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating insights." });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`AI server running on http://localhost:${PORT}`));

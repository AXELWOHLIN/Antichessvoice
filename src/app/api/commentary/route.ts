import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ commentary: "" });
  }

  const { fen, lastMoveSan, moveHistory, movedByAi } = (await request.json()) as {
    fen: string;
    lastMoveSan: string;
    moveHistory: string[];
    movedByAi: boolean;
  };

  if (!fen || !lastMoveSan) {
    return NextResponse.json({ commentary: "" });
  }

  const moveNum = Math.ceil(moveHistory.length / 2);
  const prompt = `You are a witty chess commentator for an antichess game. Antichess rules: captures are mandatory, the goal is to lose all your pieces. The king has no special status.

Current position (FEN): ${fen}
Move ${moveNum}: ${lastMoveSan}
This move was made by: ${movedByAi ? "the AI opponent" : "the human player"}
Full move history: ${moveHistory.join(" ")}

Generate a single short sentence (10-20 words) commenting on this move. Be entertaining and insightful about the antichess strategy.
${movedByAi ? "Explain the AI's antichess thinking (sacrificing pieces, forcing the opponent to capture)." : "React to the player's move with commentary."}
Respond with ONLY the commentary text, no quotes, no JSON.`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4-1-fast-non-reasoning",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ commentary: "" });
    }

    const data = await response.json();
    const commentary = data.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ commentary });
  } catch {
    return NextResponse.json({ commentary: "" });
  }
}

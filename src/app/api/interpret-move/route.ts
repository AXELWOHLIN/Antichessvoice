import { NextRequest, NextResponse } from "next/server";

interface LegalMoveInput {
  from: string;
  to: string;
  san: string;
  promotion?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { transcript, fen, legalMoves } = (await request.json()) as {
    transcript: string;
    fen: string;
    legalMoves: LegalMoveInput[];
  };

  if (!transcript || !fen || !legalMoves) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const movesDescription = legalMoves
    .map((m) => `${m.san} (${m.from}->${m.to}${m.promotion ? " promote to " + m.promotion : ""})`)
    .join(", ");

  const prompt = `You are a chess move interpreter for an antichess game. The player spoke a move using their voice. Your job is to figure out which legal move they meant and ALWAYS return a valid move.

Board state (FEN): ${fen}

Legal moves available: ${movesDescription}

The player said: "${transcript}"

Rules of antichess: Captures are mandatory. The goal is to lose all your pieces. The king has no special status.

Instructions:
1. Try to match the player's words to a legal move. Consider:
   - "horse" or "horsey" means knight
   - Square names like "e4" or "e 4" or "echo 4"
   - Piece names like "pawn", "bishop", "rook", "queen", "king", "knight"
   - "take" or "capture" meaning a capture move
   - Informal descriptions like "move my pawn forward"
2. If the player gives a vague command like "win the game", "make a good move", "you choose", "just play", or anything that isn't a specific move, then YOU choose the best strategic move from the legal moves list. In antichess the goal is to LOSE all your pieces, so pick a move that helps achieve that.
3. NEVER return an error. ALWAYS return a valid move from the legal moves list.

Respond with ONLY a JSON object (no markdown, no code blocks): {"from": "e2", "to": "e4"} or {"from": "a7", "to": "a8", "promotion": "queen"} if it's a promotion.`;

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
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `xAI API error: ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If LLM response isn't valid JSON, pick a random legal move
      const fallback = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return NextResponse.json({ from: fallback.from, to: fallback.to, promotion: fallback.promotion });
    }

    // Validate the move is actually legal, fall back to random if not
    const isLegal = legalMoves.some(
      (m) =>
        m.from === parsed.from &&
        m.to === parsed.to &&
        (!parsed.promotion || m.promotion === parsed.promotion)
    );

    if (!isLegal || parsed.error) {
      const fallback = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return NextResponse.json({ from: fallback.from, to: fallback.to, promotion: fallback.promotion });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    // On any failure, pick a random legal move so the game keeps going
    if (legalMoves.length > 0) {
      const fallback = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return NextResponse.json({ from: fallback.from, to: fallback.to, promotion: fallback.promotion });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to interpret move: ${message}` },
      { status: 500 }
    );
  }
}

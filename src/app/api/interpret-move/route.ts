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

  const prompt = `You are a chess move interpreter for an antichess game. The player spoke a move using their voice. Your job is to figure out which legal move they meant.

Board state (FEN): ${fen}

Legal moves available: ${movesDescription}

The player said: "${transcript}"

Rules of antichess: Captures are mandatory. The goal is to lose all your pieces. The king has no special status.

Based on what the player said, which legal move did they mean? Consider that:
- "horse" or "horsey" means knight
- They might say square names like "e4" or "e 4" or "echo 4"
- They might say piece names like "pawn", "bishop", "rook", "queen", "king", "knight"
- They might say "take" or "capture" meaning a capture move
- They might describe moves informally like "move my pawn forward"

Respond with ONLY a JSON object (no markdown, no code blocks): {"from": "e2", "to": "e4"} or {"from": "a7", "to": "a8", "promotion": "queen"} if it's a promotion.
If you cannot determine the move, respond with: {"error": "Could not understand the move"}`;

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

    const parsed = JSON.parse(content);

    if (parsed.error) {
      return NextResponse.json(parsed, { status: 422 });
    }

    // Validate the move is actually legal
    const isLegal = legalMoves.some(
      (m) =>
        m.from === parsed.from &&
        m.to === parsed.to &&
        (!parsed.promotion || m.promotion === parsed.promotion)
    );

    if (!isLegal) {
      return NextResponse.json(
        { error: "AI suggested an illegal move. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to interpret move: ${message}` },
      { status: 500 }
    );
  }
}

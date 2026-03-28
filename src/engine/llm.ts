import type { LegalMove } from "./antichess";

interface InterpretMoveResponse {
  from: string;
  to: string;
  promotion?: string;
  error?: string;
}

export async function interpretVoiceMove(
  transcript: string,
  fen: string,
  legalMoves: LegalMove[]
): Promise<InterpretMoveResponse> {
  const response = await fetch("/api/interpret-move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, fen, legalMoves }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { from: "", to: "", error: text || "Failed to interpret move" };
  }

  return response.json();
}

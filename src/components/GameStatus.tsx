"use client";

import type { Color } from "chessops/types";

interface GameStatusProps {
  turn: Color;
  isGameOver: boolean;
  winner: Color | undefined;
  capturedPieces: { white: string[]; black: string[] };
  playerColor: Color;
}

const PIECE_SYMBOLS: Record<string, string> = {
  P: "♟",
  N: "♞",
  B: "♝",
  R: "♜",
  Q: "♛",
  K: "♚",
};

export default function GameStatus({
  turn,
  isGameOver,
  winner,
  capturedPieces,
  playerColor,
}: GameStatusProps) {
  const aiColor = playerColor === "white" ? "black" : "white";

  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full space-y-3">
      {/* Turn indicator */}
      <div className="text-center">
        {isGameOver ? (
          <div className="space-y-1">
            <p className="text-xl font-bold text-yellow-400">Game Over!</p>
            <p className="text-sm text-gray-300">
              {winner
                ? winner === playerColor
                  ? "You win! You lost all your pieces!"
                  : "AI wins! It lost all its pieces!"
                : "Draw - Stalemate!"}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400">
              {turn === playerColor ? "Your turn" : "AI is thinking..."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  turn === "white" ? "bg-white" : "bg-gray-900 border border-gray-600"
                }`}
              />
              <span className="text-white capitalize">{turn} to move</span>
            </div>
          </div>
        )}
      </div>

      {/* Captured pieces */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-20">AI captured:</span>
          <span className="text-lg tracking-wider">
            {capturedPieces[playerColor].map((p, i) => (
              <span key={i} className="opacity-80">
                {PIECE_SYMBOLS[p] || p}
              </span>
            ))}
            {capturedPieces[playerColor].length === 0 && (
              <span className="text-xs text-gray-600">none</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-20">You captured:</span>
          <span className="text-lg tracking-wider">
            {capturedPieces[aiColor].map((p, i) => (
              <span key={i} className="opacity-80">
                {PIECE_SYMBOLS[p] || p}
              </span>
            ))}
            {capturedPieces[aiColor].length === 0 && (
              <span className="text-xs text-gray-600">none</span>
            )}
          </span>
        </div>
      </div>

      {/* Antichess reminder */}
      <div className="text-xs text-gray-600 text-center border-t border-gray-700 pt-2">
        Antichess: Captures are mandatory. Lose all pieces to win!
      </div>
    </div>
  );
}

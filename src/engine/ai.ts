import { AntichessGame, type LegalMove } from "./antichess";
import type { Color, Role } from "chessops/types";

const PIECE_VALUES: Record<string, number> = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 4,
};

function evaluatePosition(game: AntichessGame, maximizingColor: Color): number {
  const state = game.getState();

  if (state.isGameOver) {
    // In antichess, losing all pieces = winning
    if (state.winner === maximizingColor) return 10000;
    if (state.winner === opposite(maximizingColor)) return -10000;
    return 0; // draw
  }

  const pieces = state.pieces;
  let score = 0;

  // Count material - in antichess, FEWER pieces is better
  for (const [, piece] of Object.entries(pieces)) {
    const color = piece[0] === "w" ? "white" : "black";
    const role = piece[1];
    const value = PIECE_VALUES[role] || 0;

    if (color === maximizingColor) {
      score -= value; // Own pieces are bad (want to lose them)
    } else {
      score += value; // Opponent pieces are good (they still have them)
    }
  }

  // Bonus for having fewer pieces
  const ownPieceCount = Object.values(pieces).filter(
    (p) => (p[0] === "w" ? "white" : "black") === maximizingColor
  ).length;
  score -= ownPieceCount * 2;

  // Bonus for opponent having more legal moves (more chances to capture our pieces)
  if (state.turn !== maximizingColor) {
    score += state.legalMoves.length * 0.1;
  }

  return score;
}

function opposite(color: Color): Color {
  return color === "white" ? "black" : "white";
}

function minimax(
  game: AntichessGame,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: Color
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game, aiColor);
  }

  const moves = game.getLegalMoves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const clone = game.clone();
      clone.makeMove(move.from, move.to, move.promotion);
      const eval_ = minimax(clone, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const clone = game.clone();
      clone.makeMove(move.from, move.to, move.promotion);
      const eval_ = minimax(clone, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function findBestMove(
  game: AntichessGame,
  depth: number = 4
): LegalMove | null {
  const moves = game.getLegalMoves();
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const aiColor = game.getTurn();
  let bestMove = moves[0];
  let bestEval = -Infinity;

  for (const move of moves) {
    const clone = game.clone();
    clone.makeMove(move.from, move.to, move.promotion);
    const eval_ = minimax(
      clone,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      aiColor
    );
    if (eval_ > bestEval) {
      bestEval = eval_;
      bestMove = move;
    }
  }

  return bestMove;
}

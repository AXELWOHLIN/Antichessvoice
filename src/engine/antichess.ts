import { Antichess as ChessopsAntichess } from "chessops/variant";
import { parseFen, makeFen } from "chessops/fen";
import { makeSan, parseSan } from "chessops/san";
import { makeSquare, parseSquare, opposite } from "chessops/util";
import { roleToChar } from "chessops/util";
import type { Move, Piece, Square, Color, Role } from "chessops/types";

export interface BoardPieces {
  [square: string]: string; // e.g. "wP", "bK"
}

export interface LegalMove {
  from: string;
  to: string;
  san: string;
  promotion?: Role;
}

export interface GameState {
  fen: string;
  pieces: BoardPieces;
  turn: Color;
  legalMoves: LegalMove[];
  isGameOver: boolean;
  winner: Color | undefined;
  moveHistory: string[];
  capturedPieces: { white: string[]; black: string[] };
}

export class AntichessGame {
  private pos: ChessopsAntichess;
  private moveHistory: string[] = [];
  private capturedPieces: { white: string[]; black: string[] } = {
    white: [],
    black: [],
  };

  constructor() {
    this.pos = ChessopsAntichess.default();
  }

  static fromFen(fen: string): AntichessGame {
    const game = new AntichessGame();
    const setup = parseFen(fen).unwrap();
    game.pos = ChessopsAntichess.fromSetup(setup).unwrap();
    return game;
  }

  clone(): AntichessGame {
    const game = new AntichessGame();
    game.pos = this.pos.clone();
    game.moveHistory = [...this.moveHistory];
    game.capturedPieces = {
      white: [...this.capturedPieces.white],
      black: [...this.capturedPieces.black],
    };
    return game;
  }

  getFen(): string {
    return makeFen(this.pos.toSetup());
  }

  getTurn(): Color {
    return this.pos.turn;
  }

  getPieces(): BoardPieces {
    const pieces: BoardPieces = {};
    for (const [sq, piece] of this.pos.board) {
      const squareName = makeSquare(sq);
      const colorChar = piece.color === "white" ? "w" : "b";
      const roleChar = roleToChar(piece.role).toUpperCase();
      pieces[squareName] = colorChar + roleChar;
    }
    return pieces;
  }

  getLegalMoves(): LegalMove[] {
    const moves: LegalMove[] = [];
    const dests = this.pos.allDests();

    for (const [from, toSet] of dests) {
      for (const to of toSet) {
        const fromName = makeSquare(from);
        const toName = makeSquare(to);

        // Check if this is a promotion move
        const piece = this.pos.board.get(from);
        const toRank = to >> 3;
        const isPromotion =
          piece?.role === "pawn" && (toRank === 0 || toRank === 7);

        if (isPromotion) {
          // In antichess, pawns can promote to king too
          const promotionRoles: Role[] = [
            "queen",
            "rook",
            "bishop",
            "knight",
            "king",
          ];
          for (const promo of promotionRoles) {
            const move: Move = { from, to, promotion: promo };
            const san = makeSan(this.pos, move);
            moves.push({ from: fromName, to: toName, san, promotion: promo });
          }
        } else {
          const move: Move = { from, to };
          const san = makeSan(this.pos, move);
          moves.push({ from: fromName, to: toName, san });
        }
      }
    }
    return moves;
  }

  makeMove(
    from: string,
    to: string,
    promotion?: Role
  ): { success: boolean; san: string } {
    const fromSq = parseSquare(from);
    const toSq = parseSquare(to);
    if (fromSq === undefined || toSq === undefined) {
      return { success: false, san: "" };
    }

    const move: Move = { from: fromSq, to: toSq, promotion };

    // Validate move is legal before playing
    if (!this.pos.isLegal(move)) {
      return { success: false, san: "" };
    }

    // Check if this captures a piece
    const targetPiece = this.pos.board.get(toSq);
    if (targetPiece) {
      const colorKey = targetPiece.color;
      this.capturedPieces[colorKey].push(
        roleToChar(targetPiece.role).toUpperCase()
      );
    }

    const san = makeSan(this.pos, move);
    this.pos.play(move);
    this.moveHistory.push(san);

    return { success: true, san };
  }

  makeSanMove(san: string): { success: boolean; san: string } {
    const move = parseSan(this.pos, san);
    if (!move) {
      return { success: false, san: "" };
    }

    if ("from" in move && "to" in move) {
      const targetPiece = this.pos.board.get(move.to);
      if (targetPiece) {
        this.capturedPieces[targetPiece.color].push(
          roleToChar(targetPiece.role).toUpperCase()
        );
      }
    }

    const sanStr = makeSan(this.pos, move);
    this.pos.play(move);
    this.moveHistory.push(sanStr);
    return { success: true, san: sanStr };
  }

  isGameOver(): boolean {
    return this.pos.isEnd();
  }

  getOutcome(): { winner: Color | undefined } | undefined {
    return this.pos.outcome();
  }

  getMoveHistory(): string[] {
    return [...this.moveHistory];
  }

  getCapturedPieces(): { white: string[]; black: string[] } {
    return {
      white: [...this.capturedPieces.white],
      black: [...this.capturedPieces.black],
    };
  }

  getPosition(): ChessopsAntichess {
    return this.pos;
  }

  getState(): GameState {
    const outcome = this.getOutcome();
    return {
      fen: this.getFen(),
      pieces: this.getPieces(),
      turn: this.getTurn(),
      legalMoves: this.getLegalMoves(),
      isGameOver: this.isGameOver(),
      winner: outcome?.winner,
      moveHistory: this.getMoveHistory(),
      capturedPieces: this.getCapturedPieces(),
    };
  }
}

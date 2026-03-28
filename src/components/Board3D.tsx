"use client";

import { useState, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ChessPiece3D from "./ChessPiece3D";
import type { BoardPieces, LegalMove } from "@/engine/antichess";
import type { Color, Role } from "chessops/types";

interface Board3DProps {
  pieces: BoardPieces;
  legalMoves: LegalMove[];
  onMove: (from: string, to: string, promotion?: Role) => boolean;
  orientation: Color;
  lastMove: { from: string; to: string } | null;
  isInteractive: boolean;
}

const LIGHT_COLOR = "#edeed1";
const DARK_COLOR = "#779952";
const HIGHLIGHT_COLOR = "#bbcc44";
const LAST_MOVE_COLOR = "#f7f769";
const FILES = "abcdefgh";

function squareToWorld(
  sq: string,
  orientation: Color
): [number, number, number] {
  const file = FILES.indexOf(sq[0]);
  const rank = parseInt(sq[1]) - 1;
  const f = orientation === "white" ? file : 7 - file;
  const r = orientation === "white" ? rank : 7 - rank;
  return [f - 3.5, 0, -(r - 3.5)];
}

function worldToSquare(
  x: number,
  z: number,
  orientation: Color
): string | null {
  const f = Math.round(x + 3.5);
  const r = Math.round(-z + 3.5);
  if (f < 0 || f > 7 || r < 0 || r > 7) return null;
  const file = orientation === "white" ? f : 7 - f;
  const rank = orientation === "white" ? r : 7 - r;
  return FILES[file] + (rank + 1);
}

function BoardSquares({
  selectedSquare,
  validDestinations,
  lastMove,
  orientation,
  onSquareClick,
}: {
  selectedSquare: string | null;
  validDestinations: Set<string>;
  lastMove: { from: string; to: string } | null;
  orientation: Color;
  onSquareClick: (sq: string) => void;
}) {
  const squares = useMemo(() => {
    const result: {
      sq: string;
      pos: [number, number, number];
      isDark: boolean;
    }[] = [];
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const sq = FILES[f] + (r + 1);
        const pos = squareToWorld(sq, orientation);
        const isDark = (f + r) % 2 === 1;
        result.push({ sq, pos: [pos[0], -0.05, pos[2]], isDark });
      }
    }
    return result;
  }, [orientation]);

  return (
    <group>
      {squares.map(({ sq, pos, isDark }) => {
        const isLastMove =
          lastMove && (sq === lastMove.from || sq === lastMove.to);
        const isValidDest = validDestinations.has(sq);
        const isSelected = sq === selectedSquare;

        let color = isDark ? DARK_COLOR : LIGHT_COLOR;
        if (isLastMove) color = LAST_MOVE_COLOR;
        if (isSelected) color = HIGHLIGHT_COLOR;

        return (
          <group key={sq}>
            <mesh
              position={pos}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSquareClick(sq);
              }}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            {/* Legal move indicator */}
            {isValidDest && (
              <mesh position={[pos[0], 0.01, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial
                  color="#000000"
                  transparent
                  opacity={0.3}
                />
              </mesh>
            )}
          </group>
        );
      })}
      {/* Board border/frame */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.4, 8.4]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function BoardLabels({ orientation }: { orientation: Color }) {
  const labels: { text: string; pos: [number, number, number] }[] = [];

  for (let f = 0; f < 8; f++) {
    const fileIdx = orientation === "white" ? f : 7 - f;
    const x = f - 3.5;
    labels.push({
      text: FILES[fileIdx],
      pos: [x, -0.04, 4.5],
    });
  }

  for (let r = 0; r < 8; r++) {
    const rankNum = orientation === "white" ? r + 1 : 8 - r;
    const z = -(r - 3.5);
    labels.push({
      text: String(rankNum),
      pos: [-4.5, -0.04, z],
    });
  }

  return (
    <group>
      {labels.map(({ text, pos }, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.01, 0.01]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({
  pieces,
  legalMoves,
  onMove,
  orientation,
  lastMove,
  isInteractive,
}: Board3DProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const validDestinations = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    return new Set(
      legalMoves
        .filter((m) => m.from === selectedSquare)
        .map((m) => m.to)
    );
  }, [selectedSquare, legalMoves]);

  const handleSquareClick = useCallback(
    (sq: string) => {
      if (!isInteractive) return;

      if (selectedSquare && validDestinations.has(sq)) {
        // Try to make the move
        const toRank = parseInt(sq[1]);
        const piece = pieces[selectedSquare];
        const isPawn = piece && (piece === "wP" || piece === "bP");
        const isPromotion = isPawn && (toRank === 8 || toRank === 1);
        const promotion: Role | undefined = isPromotion ? "queen" : undefined;

        onMove(selectedSquare, sq, promotion);
        setSelectedSquare(null);
      } else if (pieces[sq]) {
        // Select this piece
        setSelectedSquare(sq === selectedSquare ? null : sq);
      } else {
        setSelectedSquare(null);
      }
    },
    [selectedSquare, validDestinations, pieces, onMove, isInteractive]
  );

  const handlePieceClick = useCallback(
    (sq: string) => {
      if (!isInteractive) return;

      if (selectedSquare && validDestinations.has(sq)) {
        // Capture: move to this square
        const toRank = parseInt(sq[1]);
        const piece = pieces[selectedSquare];
        const isPawn = piece && (piece === "wP" || piece === "bP");
        const isPromotion = isPawn && (toRank === 8 || toRank === 1);
        const promotion: Role | undefined = isPromotion ? "queen" : undefined;

        onMove(selectedSquare, sq, promotion);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(sq === selectedSquare ? null : sq);
      }
    },
    [selectedSquare, validDestinations, pieces, onMove, isInteractive]
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <directionalLight position={[-3, 8, -3]} intensity={0.3} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.8}
        minDistance={7}
        maxDistance={14}
      />

      <BoardSquares
        selectedSquare={selectedSquare}
        validDestinations={validDestinations}
        lastMove={lastMove}
        orientation={orientation}
        onSquareClick={handleSquareClick}
      />

      <BoardLabels orientation={orientation} />

      {Object.entries(pieces).map(([sq, pieceCode]) => {
        const worldPos = squareToWorld(sq, orientation);
        return (
          <ChessPiece3D
            key={sq}
            pieceCode={pieceCode}
            position={worldPos}
            isSelected={sq === selectedSquare}
            onClick={() => handlePieceClick(sq)}
          />
        );
      })}
    </>
  );
}

export default function Board3D(props: Board3DProps) {
  return (
    <div className="w-full aspect-square">
      <Canvas
        camera={{ position: [0, 8, 5], fov: 45, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}

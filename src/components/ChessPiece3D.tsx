"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ChessPiece3DProps {
  pieceCode: string;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}

const SELECTED_EMISSIVE = new THREE.Color("#44aa44");
const NO_EMISSIVE = new THREE.Color("#000000");

function PawnGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} material={material}>
        <cylinderGeometry args={[0.18, 0.25, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={material}>
        <sphereGeometry args={[0.14, 16, 12]} />
      </mesh>
    </group>
  );
}

function RookGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={material}>
        <cylinderGeometry args={[0.22, 0.26, 0.4, 16]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={material}>
        <cylinderGeometry args={[0.24, 0.22, 0.1, 16]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.16, 0.55, Math.sin(angle) * 0.16]}
            material={material}
          >
            <boxGeometry args={[0.08, 0.1, 0.08]} />
          </mesh>
        );
      })}
    </group>
  );
}

function KnightGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} material={material}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 0.38, 0.02]} rotation={[0.3, 0, 0]} material={material}>
        <boxGeometry args={[0.16, 0.32, 0.12]} />
      </mesh>
      <mesh position={[0, 0.5, 0.12]} rotation={[0.6, 0, 0]} material={material}>
        <boxGeometry args={[0.12, 0.15, 0.16]} />
      </mesh>
    </group>
  );
}

function BishopGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={material}>
        <cylinderGeometry args={[0.18, 0.24, 0.4, 16]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={material}>
        <coneGeometry args={[0.14, 0.25, 16]} />
      </mesh>
      <mesh position={[0, 0.65, 0]} material={material}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>
    </group>
  );
}

function QueenGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} material={material}>
        <cylinderGeometry args={[0.2, 0.26, 0.44, 16]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={material}>
        <cylinderGeometry args={[0.12, 0.2, 0.12, 16]} />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={material}>
        <torusGeometry args={[0.12, 0.03, 8, 16]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} material={material}>
        <sphereGeometry args={[0.06, 8, 6]} />
      </mesh>
    </group>
  );
}

function KingGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} material={material}>
        <cylinderGeometry args={[0.2, 0.26, 0.5, 16]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={material}>
        <cylinderGeometry args={[0.14, 0.2, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 0.7, 0]} material={material}>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={material}>
        <boxGeometry args={[0.18, 0.06, 0.06]} />
      </mesh>
    </group>
  );
}

const PIECE_GEOMETRIES: Record<string, React.FC<{ material: THREE.MeshStandardMaterial }>> = {
  P: PawnGeometry,
  R: RookGeometry,
  N: KnightGeometry,
  B: BishopGeometry,
  Q: QueenGeometry,
  K: KingGeometry,
};

export default function ChessPiece3D({
  pieceCode,
  position,
  isSelected,
  onClick,
}: ChessPiece3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(...position));

  targetPos.current.set(...position);

  const isWhite = pieceCode[0] === "w";
  const role = pieceCode[1];
  const PieceGeo = PIECE_GEOMETRIES[role];

  const material = useMemo(() => {
    const color = isWhite ? "#f5f0e1" : "#3a3a3a";
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: isWhite ? 0.4 : 0.3,
      metalness: isWhite ? 0.1 : 0.2,
    });
  }, [isWhite]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(targetPos.current, 0.15);
    material.emissive = isSelected ? SELECTED_EMISSIVE : NO_EMISSIVE;
    material.emissiveIntensity = isSelected ? 0.4 : 0;
  });

  if (!PieceGeo) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      <PieceGeo material={material} />
    </group>
  );
}

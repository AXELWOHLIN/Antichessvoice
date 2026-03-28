"use client";

import dynamic from "next/dynamic";

const GameBoard = dynamic(() => import("@/components/GameBoard"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-gray-400">Loading game...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Voice Antichess
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Speak your moves or drag pieces. Lose all your pieces to win!
        </p>
      </div>

      <GameBoard />
    </main>
  );
}

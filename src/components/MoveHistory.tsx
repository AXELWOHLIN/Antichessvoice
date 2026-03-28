"use client";

import { useRef, useEffect } from "react";

interface MoveHistoryProps {
  moves: string[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  const pairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        Move History
      </h3>
      <div
        ref={scrollRef}
        className="max-h-60 overflow-y-auto space-y-1 text-sm"
      >
        {pairs.length === 0 ? (
          <p className="text-gray-500 italic">No moves yet</p>
        ) : (
          pairs.map((pair) => (
            <div key={pair.number} className="flex gap-2">
              <span className="text-gray-500 w-8 text-right">
                {pair.number}.
              </span>
              <span className="text-white w-16">{pair.white}</span>
              <span className="text-gray-300 w-16">{pair.black || ""}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

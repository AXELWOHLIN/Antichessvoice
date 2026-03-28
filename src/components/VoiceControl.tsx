"use client";

import { useState } from "react";

interface VoiceControlProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onTextSubmit: (text: string) => void;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  isProcessing: boolean;
}

export default function VoiceControl({
  isListening,
  onStartListening,
  onStopListening,
  onTextSubmit,
  transcript,
  error,
  isSupported,
  isProcessing,
}: VoiceControlProps) {
  const [textInput, setTextInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed || isProcessing) return;
    onTextSubmit(trimmed);
    setTextInput("");
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Text input - always available */}
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder='Type a move, e.g. "e4" or "knight to f3"'
          disabled={isProcessing}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isProcessing || !textInput.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          Go
        </button>
      </form>

      {/* Mic button - only if supported */}
      {isSupported && (
        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isProcessing}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center text-xl
            transition-all duration-200 cursor-pointer
            ${
              isListening
                ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50"
                : isProcessing
                  ? "bg-yellow-500 cursor-wait"
                  : "bg-gray-700 hover:bg-gray-600 shadow-lg shadow-gray-700/30"
            }
            text-white
          `}
        >
          {isListening ? "⏹" : isProcessing ? "⏳" : "🎤"}
        </button>
      )}

      <div className="text-sm text-center min-h-[1.5rem]">
        {isListening && (
          <p className="text-red-400 animate-pulse">Listening...</p>
        )}
        {isProcessing && (
          <p className="text-yellow-400">Interpreting move...</p>
        )}
        {transcript && !isListening && !isProcessing && (
          <p className="text-gray-300">
            Heard: &ldquo;<span className="text-white">{transcript}</span>&rdquo;
          </p>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  );
}

"use client";

interface VoiceControlProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  isProcessing: boolean;
}

export default function VoiceControl({
  isListening,
  onStartListening,
  onStopListening,
  transcript,
  error,
  isSupported,
  isProcessing,
}: VoiceControlProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isListening ? onStopListening : onStartListening}
        disabled={!isSupported || isProcessing}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center text-2xl
          transition-all duration-200 cursor-pointer
          ${
            isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50"
              : isProcessing
                ? "bg-yellow-500 cursor-wait"
                : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30"
          }
          ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}
          text-white
        `}
      >
        {isListening ? "⏹" : isProcessing ? "⏳" : "🎤"}
      </button>

      <div className="text-sm text-center min-h-[3rem]">
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
        {!isSupported && (
          <p className="text-gray-500 text-xs">
            Voice not supported. Use Chrome or Edge.
          </p>
        )}
      </div>
    </div>
  );
}

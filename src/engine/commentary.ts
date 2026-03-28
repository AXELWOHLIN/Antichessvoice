import { speak } from "@/hooks/useSpeechRecognition";

export function fetchAndSpeakCommentary(
  fen: string,
  lastMoveSan: string,
  moveHistory: string[],
  movedByAi: boolean
): void {
  fetch("/api/commentary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fen, lastMoveSan, moveHistory, movedByAi }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.commentary) {
        // Queue commentary after any pending speech (e.g. move announcement)
        speak(data.commentary);
      }
    })
    .catch(() => {
      // Commentary is non-essential, silently fail
    });
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Board3D from "./Board3D";
import { AntichessGame, type GameState } from "@/engine/antichess";
import { findBestMove } from "@/engine/ai";
import { interpretVoiceMove } from "@/engine/llm";
import { fetchAndSpeakCommentary } from "@/engine/commentary";
import { useSpeechRecognition, speak, unlockSpeech } from "@/hooks/useSpeechRecognition";
import VoiceControl from "./VoiceControl";
import MoveHistory from "./MoveHistory";
import GameStatus from "./GameStatus";
import type { Color, Role } from "chessops/types";

type PlayerColor = Color;

export default function GameBoard() {
  const [game, setGame] = useState<AntichessGame>(() => new AntichessGame());
  const [gameState, setGameState] = useState<GameState>(() =>
    new AntichessGame().getState()
  );
  const [playerColor] = useState<PlayerColor>("white");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const gameRef = useRef(game);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: speechError,
    isSupported,
  } = useSpeechRecognition();

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const updateState = useCallback((g: AntichessGame) => {
    setGameState(g.getState());
  }, []);

  const makeAiMove = useCallback(
    (currentGame: AntichessGame) => {
      if (currentGame.isGameOver()) return;
      if (currentGame.getTurn() === playerColor) return;

      setIsAiThinking(true);

      setTimeout(() => {
        const bestMove = findBestMove(currentGame, 4);
        if (bestMove) {
          const result = currentGame.makeMove(
            bestMove.from,
            bestMove.to,
            bestMove.promotion
          );
          if (result.success) {
            setLastMove({ from: bestMove.from, to: bestMove.to });
            speak(`${result.san}`);
            fetchAndSpeakCommentary(
              currentGame.getFen(),
              result.san,
              currentGame.getMoveHistory(),
              true
            );
          }
        }
        setGame(currentGame);
        updateState(currentGame);
        setIsAiThinking(false);
      }, 300);
    },
    [playerColor, updateState]
  );

  // Handle 3D board moves (click-to-move)
  const onMove = useCallback(
    (from: string, to: string, promotion?: Role): boolean => {
      unlockSpeech(); // Unlock iOS speechSynthesis on first user interaction
      if (gameState.isGameOver) return false;
      if (gameState.turn !== playerColor) return false;

      const cloned = game.clone();
      const result = cloned.makeMove(from, to, promotion);
      if (!result.success) return false;

      setLastMove({ from, to });
      setGame(cloned);
      updateState(cloned);

      fetchAndSpeakCommentary(
        cloned.getFen(),
        result.san,
        cloned.getMoveHistory(),
        false
      );

      setTimeout(() => makeAiMove(cloned), 500);
      return true;
    },
    [game, gameState, playerColor, updateState, makeAiMove]
  );

  // Process a text/voice command through the LLM
  const processCommand = useCallback(
    (text: string) => {
      unlockSpeech(); // Unlock iOS speechSynthesis on first user interaction
      const currentGame = gameRef.current;
      if (currentGame.isGameOver() || currentGame.getTurn() !== playerColor) return;

      setIsProcessingVoice(true);
      setVoiceError(null);

      const state = currentGame.getState();

      interpretVoiceMove(text, state.fen, state.legalMoves)
        .then((result) => {
          if (result.error) {
            setVoiceError(result.error);
            speak("I didn't understand that move. Please try again.");
            return;
          }

          const cloned = currentGame.clone();
          const moveResult = cloned.makeMove(
            result.from,
            result.to,
            result.promotion as Role | undefined
          );

          if (!moveResult.success) {
            setVoiceError("That move is not valid.");
            speak("That move is not valid. Please try again.");
            return;
          }

          setLastMove({ from: result.from, to: result.to });
          setGame(cloned);
          updateState(cloned);

          fetchAndSpeakCommentary(
            cloned.getFen(),
            moveResult.san,
            cloned.getMoveHistory(),
            false
          );

          setTimeout(() => makeAiMove(cloned), 500);
        })
        .catch(() => {
          setVoiceError("Failed to connect to AI. Check your API key.");
        })
        .finally(() => {
          setIsProcessingVoice(false);
        });
    },
    [playerColor, makeAiMove, updateState]
  );

  // Handle voice transcript
  useEffect(() => {
    if (!transcript || isListening || isProcessingVoice) return;
    processCommand(transcript);
  }, [transcript, isListening, isProcessingVoice, processCommand]);

  // If AI plays first (player is black)
  useEffect(() => {
    if (playerColor === "black" && gameState.moveHistory.length === 0) {
      makeAiMove(game);
    }
  }, []);

  function resetGame() {
    const newGame = new AntichessGame();
    setGame(newGame);
    updateState(newGame);
    setLastMove(null);
    setVoiceError(null);
    setIsAiThinking(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center w-full max-w-5xl mx-auto p-4">
      {/* Board + Voice */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-[min(90vw,480px)]">
          <Board3D
            pieces={gameState.pieces}
            legalMoves={gameState.legalMoves}
            onMove={onMove}
            orientation={playerColor}
            lastMove={lastMove}
            isInteractive={!isAiThinking && !gameState.isGameOver}
          />
        </div>

        <VoiceControl
          isListening={isListening}
          onStartListening={startListening}
          onStopListening={stopListening}
          onTextSubmit={processCommand}
          transcript={transcript}
          error={voiceError || speechError}
          isSupported={isSupported}
          isProcessing={isProcessingVoice}
        />
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4 w-full lg:w-64">
        <GameStatus
          turn={gameState.turn}
          isGameOver={gameState.isGameOver}
          winner={gameState.winner}
          capturedPieces={gameState.capturedPieces}
          playerColor={playerColor}
        />

        <MoveHistory moves={gameState.moveHistory} />

        <button
          onClick={resetGame}
          className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

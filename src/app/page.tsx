"use client";

import { useState } from "react";
import DialogueInput from "@/components/DialogueInput";
import DialogueDisplay from "@/components/DialogueDisplay";
import VoiceSettings from "@/components/VoiceSettings";
import TTSController from "@/components/TTSController";

export default function Home() {
  // State for dialogue text
  const [dialogueText, setDialogueText] = useState<string>("");

  // State for parsed dialogue (array of {speaker, text} objects)
  const [parsedDialogue, setParsedDialogue] = useState<
    Array<{ speaker: string; text: string }>
  >([]);

  // State for current line being read
  const [currentLine, setCurrentLine] = useState<number>(-1);

  // State for voice settings
  const [voiceSettings, setVoiceSettings] = useState<
    Record<
      string,
      { voice: string; pitch: number; speed: number; accent: string }
    >
  >({});

  // State for playback status
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Function to handle text input changes
  const handleTextChange = (text: string) => {
    setDialogueText(text);

    // Parse the dialogue text into an array of speaker and text
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const parsed = lines.map((line) => {
      const match = line.match(/^([A-Za-z]+):\s*(.+)$/);
      if (match) {
        return { speaker: match[1], text: match[2] };
      }
      return { speaker: "Unknown", text: line };
    });

    setParsedDialogue(parsed);
  };

  // Function to handle voice setting changes
  const handleVoiceSettingsChange = (
    settings: Record<
      string,
      { voice: string; pitch: number; speed: number; accent: string }
    >,
  ) => {
    setVoiceSettings(settings);
  };

  // Function to handle playback control
  const handlePlayback = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) {
      setCurrentLine(0); // Start from the first line
    } else {
      setCurrentLine(-1); // Reset current line when stopped
    }
  };

  // Function to advance to the next line during playback
  const handleNextLine = () => {
    if (currentLine < parsedDialogue.length - 1) {
      setCurrentLine(currentLine + 1);
    } else {
      setIsPlaying(false);
      setCurrentLine(-1);
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-4 bg-background">
      <h1 className="text-3xl font-bold text-center mb-6">
        Dialogue TTS Reader
      </h1>

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* Left panel - Dialogue Input */}
        <div className="flex-1 min-w-0">
          <DialogueInput
            dialogueText={dialogueText}
            onTextChange={handleTextChange}
          />
        </div>

        {/* Right panel - Dialogue Display */}
        <div className="flex-1 min-w-0">
          <DialogueDisplay
            dialogue={parsedDialogue}
            currentLine={currentLine}
          />
        </div>
      </div>

      {/* Voice Settings Panel */}
      <div className="mt-6">
        <VoiceSettings
          characters={Array.from(new Set(parsedDialogue.map((d) => d.speaker)))}
          onVoiceSettingsChange={handleVoiceSettingsChange}
          isPlaying={isPlaying}
          onPlayClick={() => handlePlayback(true)}
          onPauseClick={() => handlePlayback(false)}
        />
      </div>

      {/* TTS Controller */}
      <div className="mt-4">
        <TTSController
          dialogue={parsedDialogue}
          voiceSettings={voiceSettings}
          isPlaying={isPlaying}
          onPlaybackChange={handlePlayback}
          onNextLine={handleNextLine}
          currentLine={currentLine}
          onLineChange={setCurrentLine}
        />
      </div>
    </main>
  );
}

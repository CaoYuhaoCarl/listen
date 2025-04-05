"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, SkipForward, SkipBack } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";

interface TTSControllerProps {
  dialogue: { speaker: string; text: string }[];
  voiceSettings: Record<
    string,
    { voice: string; pitch: number; speed: number }
  >;
  onLineChange?: (lineIndex: number) => void;
  isPlaying?: boolean;
  onPlaybackChange?: (playing: boolean) => void;
  onNextLine?: () => void;
  currentLine?: number;
}

// Speech synthesis API key and region
// In a production app, these would be environment variables
const speechKey = "YOUR_SPEECH_KEY"; // Replace with your actual key or use env variables
const speechRegion = "eastus"; // Replace with your actual region

const TTSController = ({
  dialogue = [],
  voiceSettings = {},
  onLineChange = () => {},
  isPlaying: externalIsPlaying,
  onPlaybackChange,
  onNextLine,
  currentLine: externalCurrentLine,
}: TTSControllerProps) => {
  // Use external state if provided, otherwise use internal state
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [internalCurrentLineIndex, setInternalCurrentLineIndex] = useState(0);

  const isPlaying =
    externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const currentLineIndex =
    externalCurrentLine !== undefined
      ? externalCurrentLine
      : internalCurrentLineIndex;

  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);

  // Refs for speech synthesis
  const synthesizer = useRef<speechsdk.SpeechSynthesizer | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  // Initialize audio player
  useEffect(() => {
    audioPlayer.current = new Audio();
    audioPlayer.current.onended = () => {
      if (onNextLine) {
        onNextLine();
      } else {
        nextLine();
      }
    };

    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.src = "";
      }
    };
  }, []);

  // Function to set up the speech synthesizer
  const setupSynthesizer = (voice: string, pitch: number, speed: number) => {
    try {
      // Create the speech config
      const speechConfig = speechsdk.SpeechConfig.fromSubscription(
        speechKey,
        speechRegion,
      );

      // Set the voice
      speechConfig.speechSynthesisVoiceName = voice;

      // Create an audio config
      const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();

      // Create the synthesizer
      const newSynthesizer = new speechsdk.SpeechSynthesizer(
        speechConfig,
        audioConfig,
      );

      synthesizer.current = newSynthesizer;
      return true;
    } catch (error) {
      console.error("Error setting up speech synthesizer:", error);
      return false;
    }
  };

  // Real TTS playback implementation using Microsoft Cognitive Services
  const playTTS = () => {
    if (onPlaybackChange) {
      onPlaybackChange(true);
    } else {
      setInternalIsPlaying(true);
    }

    const currentDialogue = dialogue[currentLineIndex];
    if (!currentDialogue) return;

    const speaker = currentDialogue.speaker;
    const text = currentDialogue.text;

    // Get voice settings for the current speaker
    const settings = voiceSettings[speaker] || {
      voice: "en-US-AriaNeural",
      pitch: 1.0,
      speed: 1.0,
    };

    // Set up SSML for more control over speech synthesis
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${settings.voice}">
          <prosody rate="${settings.speed}" pitch="${settings.pitch > 1 ? "+" : ""}${Math.round((settings.pitch - 1) * 100)}%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    try {
      // Set up the synthesizer with the current speaker's voice settings
      const success = setupSynthesizer(
        settings.voice,
        settings.pitch,
        settings.speed,
      );

      if (!success || !synthesizer.current) {
        console.error("Failed to set up synthesizer");
        return;
      }

      // Speak the text using SSML
      synthesizer.current.speakSsmlAsync(
        ssml,
        (result) => {
          if (
            result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted
          ) {
            console.log("Speech synthesis completed");
            // Audio is automatically played through the default speaker
          } else {
            console.error("Speech synthesis failed: " + result.errorDetails);
            if (onPlaybackChange) {
              onPlaybackChange(false);
            } else {
              setInternalIsPlaying(false);
            }
          }
        },
        (error) => {
          console.error("Error during speech synthesis: " + error);
          if (onPlaybackChange) {
            onPlaybackChange(false);
          } else {
            setInternalIsPlaying(false);
          }
        },
      );

      // Start progress tracking
      startProgressTracking();
    } catch (error) {
      console.error("Error in playTTS:", error);
      if (onPlaybackChange) {
        onPlaybackChange(false);
      } else {
        setInternalIsPlaying(false);
      }
    }
  };

  const pauseTTS = () => {
    if (onPlaybackChange) {
      onPlaybackChange(false);
    } else {
      setInternalIsPlaying(false);
    }

    if (synthesizer.current) {
      synthesizer.current.close();
    }

    if (audioPlayer.current) {
      audioPlayer.current.pause();
    }
  };

  const stopTTS = () => {
    if (onPlaybackChange) {
      onPlaybackChange(false);
    } else {
      setInternalIsPlaying(false);
    }

    if (synthesizer.current) {
      synthesizer.current.close();
    }

    if (audioPlayer.current) {
      audioPlayer.current.pause();
      audioPlayer.current.currentTime = 0;
    }

    if (externalCurrentLine === undefined) {
      setInternalCurrentLineIndex(0);
    }

    setProgress(0);
  };

  const nextLine = () => {
    if (currentLineIndex < dialogue.length - 1) {
      if (externalCurrentLine === undefined) {
        setInternalCurrentLineIndex(currentLineIndex + 1);
      }
      onLineChange(currentLineIndex + 1);
      if (isPlaying) {
        // If currently playing, start playing the next line
        playTTS();
      }
    }
  };

  const previousLine = () => {
    if (currentLineIndex > 0) {
      if (externalCurrentLine === undefined) {
        setInternalCurrentLineIndex(currentLineIndex - 1);
      }
      onLineChange(currentLineIndex - 1);
      if (isPlaying) {
        // If currently playing, start playing the previous line
        playTTS();
      }
    }
  };

  // Start tracking progress during playback
  const startProgressTracking = () => {
    // Reset progress
    setProgress(0);
  };

  // Track progress during playback
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev + 2; // Increment by 2% every interval for smoother progress
        });
      }, 200); // Update more frequently for smoother progress
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentLineIndex]);

  // Update the current line in the parent component
  useEffect(() => {
    onLineChange(currentLineIndex);
  }, [currentLineIndex, onLineChange]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <div className="w-full p-4 bg-background border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousLine}
            disabled={currentLineIndex <= 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {isPlaying ? (
            <Button variant="outline" size="icon" onClick={pauseTTS}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" onClick={playTTS}>
              <Play className="h-4 w-4" />
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={stopTTS}>
            <Square className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextLine}
            disabled={
              !dialogue.length || currentLineIndex >= dialogue.length - 1
            }
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 w-1/4">
          <span className="text-xs text-muted-foreground">Volume</span>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0])}
            className="w-full"
          />
          <span className="text-xs w-8">{volume}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {dialogue.length > 0
              ? `Current: ${currentLineIndex + 1}/${dialogue.length}`
              : "No dialogue"}
          </span>
          <span>
            {dialogue[currentLineIndex]?.speaker}:
            {dialogue[currentLineIndex]?.text?.substring(0, 30)}
            {dialogue[currentLineIndex]?.text?.length > 30 ? "..." : ""}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};

export default TTSController;

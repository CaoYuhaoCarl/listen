"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, SkipForward, SkipBack } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generateSpeech, formatTTSValue } from "@/lib/edge-tts";

interface TTSControllerProps {
  dialogue: { speaker: string; text: string }[];
  voiceSettings: Record<
    string,
    { voice: string; pitch: number; speed: number; accent?: string }
  >;
  onLineChange?: (lineIndex: number) => void;
  isPlaying?: boolean;
  onPlaybackChange?: (playing: boolean) => void;
  onNextLine?: () => void;
  currentLine?: number;
}

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
  const [isLoading, setIsLoading] = useState(false);

  // Ref for audio player
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio player
  useEffect(() => {
    audioPlayer.current = new Audio();
    audioPlayer.current.volume = volume / 100;

    audioPlayer.current.onended = () => {
      if (onNextLine) {
        onNextLine();
      } else {
        nextLine();
      }
    };

    audioPlayer.current.onpause = () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };

    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.src = "";
      }

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Real TTS playback implementation using Edge TTS
  const playTTS = async () => {
    try {
      setIsLoading(true);

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

      // Format the pitch and rate values for Edge TTS
      const pitchValue = formatTTSValue(settings.pitch, "pitch");
      const rateValue = formatTTSValue(settings.speed, "rate");
      const volumeValue = formatTTSValue(volume / 100, "volume"); // Normalize volume

      console.log("Generating speech with settings:", {
        voice: settings.voice,
        pitch: pitchValue,
        rate: rateValue,
        volume: volumeValue,
        text: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
      });

      // Generate speech using Edge TTS
      const { audioUrl } = await generateSpeech(text, {
        voice: settings.voice,
        pitch: pitchValue,
        rate: rateValue,
        volume: volumeValue,
      });

      // Play the audio
      if (audioPlayer.current) {
        audioPlayer.current.src = audioUrl;
        audioPlayer.current.volume = volume / 100;

        // Play the audio and handle any errors
        const playPromise = audioPlayer.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing audio:", error);
            if (onPlaybackChange) {
              onPlaybackChange(false);
            } else {
              setInternalIsPlaying(false);
            }
          });
        }

        // Start progress tracking based on audio duration
        startProgressTracking();
      }
    } catch (error) {
      console.error("Error in playTTS:", error);
      if (onPlaybackChange) {
        onPlaybackChange(false);
      } else {
        setInternalIsPlaying(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pauseTTS = () => {
    if (onPlaybackChange) {
      onPlaybackChange(false);
    } else {
      setInternalIsPlaying(false);
    }

    if (audioPlayer.current) {
      audioPlayer.current.pause();
    }

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const stopTTS = () => {
    if (onPlaybackChange) {
      onPlaybackChange(false);
    } else {
      setInternalIsPlaying(false);
    }

    if (audioPlayer.current) {
      audioPlayer.current.pause();
      audioPlayer.current.currentTime = 0;
    }

    if (externalCurrentLine === undefined) {
      setInternalCurrentLineIndex(0);
    }

    setProgress(0);

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
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
    } else {
      // End of dialogue
      if (onPlaybackChange) {
        onPlaybackChange(false);
      } else {
        setInternalIsPlaying(false);
      }
      setProgress(0);
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

    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Create a new interval to update progress
    progressInterval.current = setInterval(() => {
      if (audioPlayer.current) {
        const duration = audioPlayer.current.duration;
        const currentTime = audioPlayer.current.currentTime;

        if (duration > 0) {
          const progressValue = (currentTime / duration) * 100;
          setProgress(progressValue);

          // If we're at the end, clear the interval
          if (progressValue >= 99.5) {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
              progressInterval.current = null;
            }
          }
        }
      }
    }, 100);
  };

  // Effect to handle volume changes
  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.volume = volume / 100;
    }
  }, [volume]);

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

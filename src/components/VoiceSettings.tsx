"use client";

import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Play, Pause, Settings } from "lucide-react";

interface VoiceSettingsProps {
  characters?: string[];
  onVoiceSettingsChange?: (settings: VoiceSettingsMap) => void;
  onPlayClick?: () => void;
  isPlaying?: boolean;
  onPauseClick?: () => void;
}

export interface VoiceSettings {
  voice: string;
  pitch: number;
  speed: number;
  accent: string;
}

export type VoiceSettingsMap = Record<string, VoiceSettings>;

const AVAILABLE_VOICES = [
  // English voices
  "en-US-AriaNeural",
  "en-US-GuyNeural",
  "en-US-JennyNeural",
  "en-GB-SoniaNeural",
  "en-GB-RyanNeural",
  "en-AU-NatashaNeural",
  "en-AU-WilliamNeural",
  // Chinese voices
  "zh-CN-XiaoxiaoNeural",
  "zh-CN-YunxiNeural",
  "zh-CN-YunjianNeural",
  "zh-CN-XiaoyiNeural",
  "zh-CN-YunyangNeural",
  "zh-TW-HsiaoChenNeural",
  "zh-TW-YunJheNeural",
  "zh-TW-HsiaoYuNeural",
];

const AVAILABLE_ACCENTS = [
  "American",
  "British",
  "Australian",
  "Canadian",
  "Irish",
  "Scottish",
  "Chinese (Mainland)",
  "Chinese (Taiwan)",
];

const VoiceSettings = ({
  characters = ["A", "B"],
  onVoiceSettingsChange = () => {},
  onPlayClick = () => {},
  isPlaying = false,
  onPauseClick = () => {},
}: VoiceSettingsProps) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    characters[0],
  );
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsMap>(() => {
    // Initialize default voice settings for each character
    const initialSettings: VoiceSettingsMap = {};
    characters.forEach((char, index) => {
      initialSettings[char] = {
        voice: AVAILABLE_VOICES[index % AVAILABLE_VOICES.length],
        pitch: 1.0,
        speed: 1.0,
        accent: AVAILABLE_ACCENTS[0],
      };
    });
    return initialSettings;
  });

  const handleVoiceChange = (value: string) => {
    const updatedSettings = {
      ...voiceSettings,
      [selectedCharacter]: {
        ...voiceSettings[selectedCharacter],
        voice: value,
      },
    };
    setVoiceSettings(updatedSettings);
    onVoiceSettingsChange(updatedSettings);
  };

  const handlePitchChange = (value: number[]) => {
    const updatedSettings = {
      ...voiceSettings,
      [selectedCharacter]: {
        ...voiceSettings[selectedCharacter],
        pitch: value[0],
      },
    };
    setVoiceSettings(updatedSettings);
    onVoiceSettingsChange(updatedSettings);
  };

  const handleSpeedChange = (value: number[]) => {
    const updatedSettings = {
      ...voiceSettings,
      [selectedCharacter]: {
        ...voiceSettings[selectedCharacter],
        speed: value[0],
      },
    };
    setVoiceSettings(updatedSettings);
    onVoiceSettingsChange(updatedSettings);
  };

  const handleAccentChange = (value: string) => {
    const updatedSettings = {
      ...voiceSettings,
      [selectedCharacter]: {
        ...voiceSettings[selectedCharacter],
        accent: value,
      },
    };
    setVoiceSettings(updatedSettings);
    onVoiceSettingsChange(updatedSettings);
  };

  const handleCharacterSelect = (value: string) => {
    setSelectedCharacter(value);
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-full md:w-48">
                <Label htmlFor="character-select" className="mb-2 block">
                  Character
                </Label>
                <Select
                  value={selectedCharacter}
                  onValueChange={handleCharacterSelect}
                >
                  <SelectTrigger id="character-select">
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((char) => (
                      <SelectItem key={char} value={char}>
                        {char}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="voice-select" className="mb-2 block">
                  Voice Type
                </Label>
                <Select
                  value={voiceSettings[selectedCharacter]?.voice}
                  onValueChange={handleVoiceChange}
                >
                  <SelectTrigger id="voice-select">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_VOICES.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="accent-select" className="mb-2 block">
                  Accent
                </Label>
                <Select
                  value={voiceSettings[selectedCharacter]?.accent}
                  onValueChange={handleAccentChange}
                >
                  <SelectTrigger id="accent-select">
                    <SelectValue placeholder="Select accent" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ACCENTS.map((accent) => (
                      <SelectItem key={accent} value={accent}>
                        {accent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-full md:w-64">
                <Label htmlFor="pitch-slider" className="mb-2 block">
                  Pitch: {voiceSettings[selectedCharacter]?.pitch.toFixed(1)}
                </Label>
                <Slider
                  id="pitch-slider"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[voiceSettings[selectedCharacter]?.pitch]}
                  onValueChange={handlePitchChange}
                />
              </div>

              <div className="w-full md:w-64">
                <Label htmlFor="speed-slider" className="mb-2 block">
                  Speed: {voiceSettings[selectedCharacter]?.speed.toFixed(1)}
                </Label>
                <Slider
                  id="speed-slider"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[voiceSettings[selectedCharacter]?.speed]}
                  onValueChange={handleSpeedChange}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            {!isPlaying ? (
              <Button onClick={onPlayClick} className="flex items-center gap-2">
                <Play size={16} />
                Play
              </Button>
            ) : (
              <Button
                onClick={onPauseClick}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pause size={16} />
                Pause
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceSettings;

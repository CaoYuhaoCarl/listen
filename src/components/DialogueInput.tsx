"use client";

import React, { useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface DialogueInputProps {
  onDialogueChange?: (dialogue: string) => void;
}

const DialogueInput = ({ onDialogueChange = () => {} }: DialogueInputProps) => {
  const [dialogueText, setDialogueText] = useState<string>(
    "A: Hello there! How are you doing today?\nB: I'm doing great, thanks for asking. How about you?\nA: Pretty good. I've been working on this new project.",
  );

  useEffect(() => {
    // Notify parent component when dialogue changes
    onDialogueChange(dialogueText);
  }, [dialogueText, onDialogueChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDialogueText(e.target.value);
  };

  return (
    <Card className="h-full bg-background border-r">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Dialogue Input</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your dialogue in A/B format. Each line should start with a
          character identifier (like A: or B:) followed by their dialogue.
        </p>
      </CardHeader>
      <CardContent>
        <Textarea
          className="min-h-[600px] font-mono resize-none"
          placeholder="A: Hello there!\nB: Hi, how are you?\nA: I'm doing well, thanks for asking."
          value={dialogueText}
          onChange={handleTextChange}
        />
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Format Example:</h3>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
            {`A: Hello there!
B: Hi, how are you?
A: I'm doing well, thanks for asking.`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default DialogueInput;

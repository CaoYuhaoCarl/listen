import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DialogueLine {
  speaker: string;
  text: string;
  isCurrentLine?: boolean;
}

interface DialogueDisplayProps {
  dialogue: DialogueLine[];
  currentLineIndex?: number;
}

const DialogueDisplay = ({
  dialogue = [
    { speaker: "A", text: "Hello there! How are you doing today?" },
    {
      speaker: "B",
      text: "I'm doing great, thanks for asking. How about you?",
    },
    {
      speaker: "A",
      text: "Pretty good! I was wondering if you'd like to join our book club meeting next week.",
    },
    {
      speaker: "B",
      text: "That sounds interesting! What book are you reading?",
    },
  ],
  currentLineIndex = -1,
}: DialogueDisplayProps) => {
  return (
    <Card className="h-full w-full bg-background border-2">
      <CardContent className="p-4 h-full">
        <div className="flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4">Conversation</h2>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {dialogue.map((line, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${index === currentLineIndex ? "bg-primary/20 border border-primary" : "bg-muted"} ${
                    line.speaker === "A" ? "mr-12" : "ml-12"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        line.speaker === "A"
                          ? "bg-blue-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {line.speaker}
                    </div>
                    <span className="font-medium">Speaker {line.speaker}</span>
                  </div>
                  <p className="text-sm">{line.text}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default DialogueDisplay;

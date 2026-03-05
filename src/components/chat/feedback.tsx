"use client";

import { useState } from "react";

interface FeedbackProps {
  messageId: string;
}

export function Feedback({ messageId }: FeedbackProps) {
  const [selected, setSelected] = useState<"up" | "down" | null>(null);

  const handleFeedback = (type: "up" | "down") => {
    setSelected(type);
    // In production, this would send telemetry to App Insights.
    // For the POC, we log to the console.
    console.log(`Feedback: ${type} for message ${messageId}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleFeedback("up")}
        className={`text-xs transition-colors ${
          selected === "up"
            ? "text-green-600 dark:text-green-400"
            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
        aria-label="Thumbs up"
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback("down")}
        className={`text-xs transition-colors ${
          selected === "down"
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
        aria-label="Thumbs down"
      >
        👎
      </button>
    </div>
  );
}

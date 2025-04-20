import React, { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Button } from "@/components/ui/button";
import { plugins } from "@/config/plugin-config";
import { Plugin } from "@/config/plugin-config";

export default function AIChatPanel({ onPluginLaunch }: { onPluginLaunch: (plugin: Plugin) => void }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !listening) {
      const matchedPlugin = plugins.find((p) =>
        transcript.toLowerCase().includes(p.name.toLowerCase()) ||
        transcript.toLowerCase().includes(p.tag.toLowerCase()) ||
        transcript.toLowerCase().includes(p.id.toLowerCase())
      );
      if (matchedPlugin) {
        alert(`🎯 Voice matched: ${matchedPlugin.name}`);
        onPluginLaunch(matchedPlugin);
        resetTranscript();
      }
    }
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return <p className="text-red-500">Browser does not support voice recognition.</p>;
  }

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900 space-y-4">
      <h2 className="text-lg font-semibold">🎙️ AI Voice Assistant</h2>

      <p className="text-sm text-muted-foreground">
        Speak a command like: “Launch PDF tools” or “Run DocuBuddy”
      </p>

      <div className="p-3 border rounded-md bg-zinc-100 dark:bg-zinc-800 text-sm">
        <strong>You said:</strong> {transcript || "—"}
      </div>

      <div className="flex gap-2">
        <Button onClick={SpeechRecognition.startListening}>🎤 Start</Button>
        <Button onClick={SpeechRecognition.stopListening} variant="secondary">⏹️ Stop</Button>
        <Button onClick={resetTranscript} variant="ghost">🔄 Reset</Button>
      </div>
    </div>
  );
}

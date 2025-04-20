import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function VoiceUploader({ onDetect }: { onDetect: (command: string) => void }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.lang = "en-IN"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        onDetect(transcript)
        toast(`🎙️ Voice Detected: ${transcript}`)
        setIsListening(false)
      }

      recognition.onerror = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const startListening = () => {
    recognitionRef.current?.start()
    setIsListening(true)
  }

  return (
    <Button onClick={startListening} variant="outline">
      {isListening ? "🎧 Listening..." : "🎤 Voice Upload"}
    </Button>
  )
}

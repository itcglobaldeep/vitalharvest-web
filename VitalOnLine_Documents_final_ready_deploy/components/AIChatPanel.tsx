import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const plugins = [
  { name: "PDF Reader", emoji: "📄" },
  { name: "Image Enhancer", emoji: "🖼️" },
  { name: "Translator", emoji: "🌐" },
]

export default function AIChatPanel() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.lang = "en-US"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        handleUserInput(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => setIsListening(false)
      recognitionRef.current = recognition
    } else {
      toast.error("Voice recognition not supported")
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleUserInput = (text: string) => {
    if (!text.trim()) return

    const userMessage = { from: "user", text }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const matchedPlugin = plugins.find((plugin) =>
        text.toLowerCase().includes(plugin.name.toLowerCase())
      )

      if (matchedPlugin) {
        toast.success(`🚀 Launching plugin: ${matchedPlugin.emoji} ${matchedPlugin.name}`)
        setMessages((prev) => [
          ...prev,
          { from: "ai", text: `Launching ${matchedPlugin.name} for you...` },
        ])
        // TODO: trigger actual plugin here
      } else {
        const response = `I'm here to help! You said: "${text}". (Plugin not detected)`
        setMessages((prev) => [...prev, { from: "ai", text: response }])
      }
    }, 1000)
  }

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <h2 className="text-xl font-bold mb-2">🤖 DocuBuddy AI Assistant</h2>

      <div className="h-64 overflow-y-auto border p-2 rounded bg-muted">
        {messages.map((msg, index) => (
          <div key={index} className={`text-sm mb-2 ${msg.from === "user" ? "text-right" : "text-left"}`}>
            <span className={msg.from === "user" ? "bg-primary text-white px-2 py-1 rounded" : "bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded"}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUserInput(input)
          }}
        />
        <Button onClick={() => handleUserInput(input)}>Send</Button>
        <Button onClick={startListening} variant="outline">
          {isListening ? "🎤 Listening..." : "🎙️ Speak"}
        </Button>
      </div>
    </div>
  )
}

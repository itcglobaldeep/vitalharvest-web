import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";


interface Message {
  sender: "user" | "ai";
  text: string;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages([...messages, { sender: "user", text: input }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "🤖 I'm here to help you!" },
      ]);
    }, 600);

    setInput("");
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden bg-background shadow-md">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xs px-4 py-2 rounded-xl ${
              msg.sender === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-muted text-foreground"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t p-3 flex gap-2 bg-muted/30">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}

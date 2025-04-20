import OpenAI from "openai"

const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true })

export async function classifyTextWithGPT(text: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a document assistant. Extract keywords or tags from the input text.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  })

  const content = response.choices[0].message.content || ""
  return content
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 1)
}

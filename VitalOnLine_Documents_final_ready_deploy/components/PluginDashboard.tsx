import { useState } from "react"
import { Input } from "./ui/input"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "./components/ui/button"
import { PluginDialog } from "./plugin-dialog"
import { Settings } from "lucide-react"

const plugins = [
  {
    name: "PDF Reader",
    emoji: "📄",
    description: "Read and analyze PDF documents.",
    tags: ["Document", "Reader"],
    tagColor: "blue",
    summary: "Uses AI to extract and classify content from PDFs automatically."
  },
  {
    name: "Image Enhancer",
    emoji: "🖼️",
    description: "Improve image quality using AI filters.",
    tags: ["Image", "Enhancer"],
    tagColor: "green",
    summary: "AI-powered enhancement tool for low-quality or blurry images."
  },
  {
    name: "Language Translator",
    emoji: "🌐",
    description: "Translate text between 50+ languages.",
    tags: ["Language", "Text"],
    tagColor: "purple",
    summary: "Real-time language translation using advanced NLP models."
  },
]

export default function PluginDashboard() {
  const [search, setSearch] = useState("")
  const [activeTag, setActiveTag] = useState("All")
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null)
  const [history, setHistory] = useState<string[]>([])

  const toggleFavorite = (name: string) => {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const filteredPlugins = plugins.filter((plugin) => {
    const matchTag = activeTag === "All" || plugin.tags.includes(activeTag)
    const matchSearch = plugin.name.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="🔍 Search plugins..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="flex flex-wrap gap-2 mb-2">
        {["All", ...new Set(plugins.flatMap(p => p.tags))].map(tag => (
          <Button
            key={tag}
            size="sm"
            variant={tag === activeTag ? "default" : "outline"}
            onClick={() => setActiveTag(tag)}
          >
            #{tag}
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <Card
            key={plugin.name}
            onClick={() => setSelectedPlugin(plugin)}
            className="cursor-pointer transition hover:shadow-md"
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {plugin.emoji} {plugin.name}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      toast("Plugin settings coming soon ⚙️")
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(plugin.name)
                    }}
                  >
                    {favorites.includes(plugin.name) ? "❤️" : "🤍"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {plugin.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {plugin.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full bg-${plugin.tagColor}-100 text-${plugin.tagColor}-800 dark:bg-${plugin.tagColor}-900 dark:text-${plugin.tagColor}-200`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PluginDialog
        plugin={selectedPlugin}
        onOpenChange={() => setSelectedPlugin(null)}
        onRun={() => {
          const entry = `${selectedPlugin?.name} ran at ${new Date().toLocaleTimeString()}`
          setHistory([entry, ...history])
          toast.loading(`${selectedPlugin?.name} running...`)
          setTimeout(() => {
            toast.success(`${selectedPlugin?.name} completed ✅`)
          }, 1500)
        }}
      />

      <div className="mt-6">
        <h4 className="font-semibold mb-2">🕒 Recent Activity</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          {history.map((h, i) => (
            <li key={i}>• {h}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

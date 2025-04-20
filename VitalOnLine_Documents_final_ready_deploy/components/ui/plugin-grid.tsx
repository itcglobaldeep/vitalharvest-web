import { Button } from "./ui/button";

const plugins = [
  {
    name: "PDF Reader",
    emoji: "📄",
    description: "View and extract text from PDF files",
  },
  {
    name: "Image Enhancer",
    emoji: "🖼️",
    description: "Enhance and resize images on the fly",
  },
  {
    name: "Doc Formatter",
    emoji: "📝",
    description: "Auto-format your documents for print",
  },
];

export function PluginGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {plugins.map((plugin, index) => (
        <div
          key={index}
          className="rounded-2xl border border-muted p-6 shadow-sm bg-background transition hover:shadow-md"
        >
          <div className="text-4xl mb-2">{plugin.emoji}</div>
          <h2 className="text-lg font-semibold mb-1">{plugin.name}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {plugin.description}
          </p>
          <Button variant="default" size="sm">
            Launch
          </Button>
        </div>
      ))}
    </div>
  );
}

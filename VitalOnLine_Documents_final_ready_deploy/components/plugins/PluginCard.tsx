import { Button } from "@/components/ui/button"
import { PluginModal } from "./PluginModal"

export function PluginCard() {
  return (
    <div className="border p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">Example Plugin</h3>
      <p className="text-sm text-muted-foreground">This is a demo plugin with cool stuff.</p>

      <div className="mt-4">
        <PluginModal
          title="Example Plugin"
          description="This plugin does something amazing. Configure below."
          trigger={<Button variant="default">Launch</Button>}
        >
          {/* You can add plugin controls here later */}
          <p className="text-sm">Settings will go here…</p>
        </PluginModal>
      </div>
    </div>
  )
}

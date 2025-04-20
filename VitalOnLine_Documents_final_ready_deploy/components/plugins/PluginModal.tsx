import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PluginModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">🧩 Open Plugin Details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Plugin Details</DialogTitle>
        <DialogDescription>
          Yahan plugin ka description, options, toggle, controls, sab kuch add hoga.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

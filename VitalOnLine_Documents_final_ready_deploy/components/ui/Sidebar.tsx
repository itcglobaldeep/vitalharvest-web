// src/components/layout/Sidebar.tsx
import { cn } from "@/lib/utils"; // if using cn from shadcn/utils
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <div className="w-64 h-full bg-gray-100 dark:bg-gray-900 p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Plugins</h2>
      <ul className="space-y-2">
        <li><Button variant="ghost" className="w-full justify-start">DocuBuddy AI</Button></li>
        <li><Button variant="ghost" className="w-full justify-start">PDF Tools</Button></li>
        <li><Button variant="ghost" className="w-full justify-start">Image Editor</Button></li>
      </ul>
    </div>
  );
}

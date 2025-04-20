// src/components/layout/Topbar.tsx
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 shadow">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">DocuBuddy AI</h1>
      <ThemeToggle />
    </div>
  );
}

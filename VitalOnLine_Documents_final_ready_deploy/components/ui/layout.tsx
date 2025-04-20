import { ThemeToggle } from "./theme-toggle"; // adjust path if needed

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">DocuBuddy AI</h1>
        <ThemeToggle />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

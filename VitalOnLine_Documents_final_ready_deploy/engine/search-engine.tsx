import { getMemory } from "./memory-store"

export function searchFilesByQuery(query: string): any[] {
  const memory = getMemory()
  const lower = query.toLowerCase()

  return memory.flatMap((entry) =>
    entry.files.filter(
      (file) =>
        file.fileName.toLowerCase().includes(lower) ||
        file.tags.some((t) => t.includes(lower)) ||
        entry.partyName.toLowerCase().includes(lower)
    )
  )
}

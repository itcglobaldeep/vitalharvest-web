type MemoryEntry = {
  partyName: string
  gstin?: string
  pan?: string
  files: {
    fileName: string
    date: string
    tags: string[]
    folder: string
  }[]
}

let memory: MemoryEntry[] = []

export function saveToMemory(entry: MemoryEntry) {
  const existing = memory.find(m => m.partyName === entry.partyName)
  if (existing) {
    existing.files.push(...entry.files)
  } else {
    memory.push(entry)
  }
}

export function getMemory() {
  return memory
}

export function findByParty(party: string) {
  return memory.find(m => m.partyName.toLowerCase().includes(party.toLowerCase()))
}

export function searchMemory(query: string) {
  return memory.filter(m =>
    m.partyName.toLowerCase().includes(query.toLowerCase()) ||
    m.files.some(f => f.tags.includes(query.toLowerCase()))
  )
}

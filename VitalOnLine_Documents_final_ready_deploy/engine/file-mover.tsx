export async function moveFileToFolder(fileName: string, folder: string): Promise<string> {
  // Simulate a file move — in real app this would happen via backend/electron
  return `Moved ${fileName} to /user/${folder}`
}

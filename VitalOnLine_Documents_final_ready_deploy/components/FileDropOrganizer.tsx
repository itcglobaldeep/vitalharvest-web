import React, { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { classifyFile } from "@/engine/memory-engine"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

export default function FileDropOrganizer() {
  const [results, setResults] = useState<any[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(async (file) => {
      const fileType = detectFileType(file.name)
      const text = await fakeExtractText(file) // simulate OCR / PDF text extract

      const meta = {
        fileName: file.name,
        fileType,
        contentText: text,
      }

      const result = classifyFile(meta)
      setResults((prev) => [result, ...prev])
      toast.success(`📦 Organized: ${result.suggestedFileName}`)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
          isDragActive ? "bg-green-100 dark:bg-green-900" : "bg-muted"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-lg">📂 Drag & drop files here to auto-organize</p>
      </div>

      {results.map((res, i) => (
        <Card key={i} className="p-4 space-y-1">
          <h3 className="font-semibold text-primary">📁 {res.suggestedFolder}</h3>
          <p className="text-sm text-muted-foreground">💾 {res.suggestedFileName}</p>
          <p className="text-sm">🧠 Tags: {res.tags.join(", ")}</p>
          <p className="text-xs text-green-600">
            {res.detectedFields.partyName && <>👤 Party: {res.detectedFields.partyName}<br /></>}
            {res.detectedFields.gstin && <>🧾 GSTIN: {res.detectedFields.gstin}<br /></>}
            {res.detectedFields.pan && <>📌 PAN: {res.detectedFields.pan}<br /></>}
            {res.detectedFields.date && <>📅 Date: {res.detectedFields.date}<br /></>}
          </p>
        </Card>
      ))}
    </div>
  )
}

// Simulate OCR / text extract
async function fakeExtractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.includes("sharma")) {
    return "Party Name: Sharma Traders\nGSTIN: 22AAAAA0000A1Z5\nDate: 01/04/2024"
  }
  if (name.includes("gupta")) {
    return "Name: Gupta Textiles\nPAN: AAAPL1234C\nDate: 10-03-2023"
  }
  return "Party Name: Unknown Client\nDate: 12/02/2024"
}

function detectFileType(fileName: string): "pdf" | "image" | "doc" | "unknown" {
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (!ext) return "unknown"
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "image"
  if (["pdf"].includes(ext)) return "pdf"
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return "doc"
  return "unknown"
}

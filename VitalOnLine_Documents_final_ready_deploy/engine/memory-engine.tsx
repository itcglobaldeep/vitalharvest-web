type FileMeta = {
  fileName: string
  contentText: string
  fileType: "image" | "pdf" | "doc" | "unknown"
  detectedFields?: {
    gstin?: string
    pan?: string
    partyName?: string
    date?: string
  }
}

type OrganizedResult = {
  suggestedFolder: string
  suggestedFileName: string
  tags: string[]
  detectedFields: FileMeta["detectedFields"]
}

export function classifyFile(file: FileMeta): OrganizedResult {
  const { contentText, fileName, fileType } = file
  const detectedFields: FileMeta["detectedFields"] = {}

  // Detect Party Name (very simple match for now)
  const partyMatch = contentText.match(/(?:Party Name|Name)\s*[:\-]?\s*(\w+\s*\w*)/i)
  if (partyMatch) detectedFields.partyName = partyMatch[1]

  // GSTIN
  const gstinMatch = contentText.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/)
  if (gstinMatch) detectedFields.gstin = gstinMatch[0]

  // PAN
  const panMatch = contentText.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/)
  if (panMatch) detectedFields.pan = panMatch[0]

  // Date
  const dateMatch = contentText.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/)
  if (dateMatch) detectedFields.date = dateMatch[0]

  // Suggested folder
  let folder = "Unsorted"
  if (fileType === "image") folder = "Photos"
  if (fileType === "pdf") folder = "Documents"
  if (detectedFields.partyName) folder = `Parties/${detectedFields.partyName}`

  // Suggested filename
  const baseName = detectedFields.partyName || fileName.split(".")[0]
  const suggestedFileName = `${baseName}_${detectedFields.date || "undated"}`.replace(/\s+/g, "_") + `.${fileType}`

  // Tag suggestions
  const tags = []
  if (detectedFields.gstin) tags.push("gstin")
  if (detectedFields.pan) tags.push("pan")
  if (fileType === "image") tags.push("photo")
  if (fileType === "pdf") tags.push("pdf")

  return {
    suggestedFolder: folder,
    suggestedFileName,
    tags,
    detectedFields,
  }
}

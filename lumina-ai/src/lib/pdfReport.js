const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN_X = 48
const MARGIN_TOP = 56
const MARGIN_BOTTOM = 44
const DEFAULT_FONT_SIZE = 11
const LINE_GAP = 4

const encoder = new TextEncoder()

const toByteLength = (value) => encoder.encode(value).length

const escapePdfText = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const wrapText = (text, maxChars) => {
  const raw = String(text || '')
  if (!raw.trim()) return ['']
  const lines = []

  raw.split(/\r?\n/).forEach((paragraph, paragraphIndex, allParagraphs) => {
    const cleanParagraph = paragraph.trim()
    if (!cleanParagraph) {
      lines.push('')
      return
    }

    const words = cleanParagraph.split(/\s+/)
    let current = ''
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length <= maxChars) {
        current = candidate
        return
      }
      if (current) lines.push(current)
      current = word
    })
    if (current) lines.push(current)

    if (paragraphIndex < allParagraphs.length - 1) lines.push('')
  })

  return lines.length ? lines : ['']
}

const toPdfBlob = (entries) => {
  const pages = [[]]
  let currentPage = 0
  let y = PAGE_HEIGHT - MARGIN_TOP

  const pushNewPage = () => {
    pages.push([])
    currentPage += 1
    y = PAGE_HEIGHT - MARGIN_TOP
  }

  entries.forEach((entry) => {
    const size = Number(entry.size || DEFAULT_FONT_SIZE)
    const bold = Boolean(entry.bold)
    const lineHeight = size + LINE_GAP
    const maxChars = Math.max(20, Math.floor((PAGE_WIDTH - MARGIN_X * 2) / (size * 0.52)))
    const lines = wrapText(entry.text, maxChars)

    lines.forEach((line) => {
      if (y < MARGIN_BOTTOM + lineHeight) pushNewPage()
      pages[currentPage].push({
        text: line,
        size,
        bold,
        y,
      })
      y -= lineHeight
    })

    if (entry.spacingAfter) {
      y -= Number(entry.spacingAfter)
    }
  })

  const objects = {}
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

  let nextId = 5
  const pageObjectIds = []

  pages.forEach((pageLines) => {
    const contentId = nextId
    nextId += 1
    const pageId = nextId
    nextId += 1

    const stream = [
      'BT',
      ...pageLines.flatMap((line) => [
        `${line.bold ? '/F2' : '/F1'} ${line.size} Tf`,
        `1 0 0 1 ${MARGIN_X} ${line.y.toFixed(2)} Tm`,
        `(${escapePdfText(line.text)}) Tj`,
      ]),
      'ET',
    ].join('\n')

    objects[contentId] = `<< /Length ${toByteLength(stream)} >>\nstream\n${stream}\nendstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    pageObjectIds.push(pageId)
  })

  objects[2] = `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] >>`

  const maxId = nextId - 1
  let pdf = '%PDF-1.4\n'
  const offsets = Array(maxId + 1).fill(0)

  for (let id = 1; id <= maxId; id += 1) {
    offsets[id] = toByteLength(pdf)
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }

  const xrefOffset = toByteLength(pdf)
  pdf += `xref\n0 ${maxId + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let id = 1; id <= maxId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export const downloadLearningReportPdf = ({
  fileName = 'lumina-learning-report.pdf',
  learnerName = 'Learner',
  generatedAt = new Date().toLocaleString(),
  summary = '',
  highlights = [],
  strengths = [],
  weaknesses = [],
  resources = [],
  planWeeks = [],
}) => {
  const entries = [
    { text: 'Lumina AI - Adaptive Learning Report', size: 20, bold: true, spacingAfter: 3 },
    { text: `Learner: ${learnerName}`, size: 11 },
    { text: `Generated: ${generatedAt}`, size: 11, spacingAfter: 6 },
  ]

  if (highlights.length) {
    entries.push({ text: 'Performance Snapshot', size: 14, bold: true, spacingAfter: 2 })
    highlights.forEach((item, index) => {
      entries.push({ text: `${index + 1}. ${item}`, size: 11 })
    })
    entries.push({ text: '', size: 10 })
  }

  if (summary) {
    entries.push({ text: 'Narrative Summary', size: 14, bold: true, spacingAfter: 2 })
    entries.push({ text: summary, size: 11, spacingAfter: 6 })
  }

  entries.push({ text: 'Top Strengths', size: 14, bold: true, spacingAfter: 2 })
  if (strengths.length) {
    strengths.forEach((item, index) => {
      entries.push({ text: `${index + 1}. ${item}`, size: 11 })
    })
  } else {
    entries.push({ text: '1. No strength data available yet.', size: 11 })
  }

  entries.push({ text: '', size: 11 })
  entries.push({ text: 'Priority Focus Areas', size: 14, bold: true, spacingAfter: 2 })
  if (weaknesses.length) {
    weaknesses.forEach((item, index) => {
      entries.push({ text: `${index + 1}. ${item}`, size: 11 })
    })
  } else {
    entries.push({ text: '1. No weak concept data available yet.', size: 11 })
  }

  entries.push({ text: '', size: 11 })
  entries.push({ text: 'Recommended Resources', size: 14, bold: true, spacingAfter: 2 })
  if (resources.length) {
    resources.forEach((item, index) => {
      entries.push({ text: `${index + 1}. ${item.title}`, size: 11, bold: true })
      entries.push({ text: `   ${item.meta}`, size: 10 })
      if (item.url) entries.push({ text: `   ${item.url}`, size: 10 })
    })
  } else {
    entries.push({ text: '1. No resource recommendations available yet.', size: 11 })
  }

  entries.push({ text: '', size: 11 })
  entries.push({ text: 'Action Plan', size: 14, bold: true, spacingAfter: 2 })
  if (planWeeks.length) {
    planWeeks.forEach((week) => {
      entries.push({ text: `Week ${week.week}: ${week.goal}`, size: 11, bold: true })
      if (Array.isArray(week.tasks) && week.tasks.length) {
        week.tasks.forEach((task, index) => {
          entries.push({ text: `   ${index + 1}. ${task}`, size: 10 })
        })
      } else {
        entries.push({ text: '   1. No tasks listed for this week.', size: 10 })
      }
      entries.push({ text: '', size: 10 })
    })
  } else {
    entries.push({ text: '1. No weekly plan data available yet.', size: 11 })
  }

  const blob = toPdfBlob(entries)
  triggerDownload(blob, fileName)
}

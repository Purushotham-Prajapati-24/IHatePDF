import { Document, Packer, Paragraph, TextRun } from 'docx';
import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';

const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const LINE_Y_TOLERANCE = 4;
const DEFAULT_FONT_SIZE = 22;

GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

interface PdfTextItem {
  str: string;
  transform: number[];
}

interface TextRunPosition {
  text: string;
  x: number;
  y: number;
  size: number;
}

interface TextLine {
  y: number;
  runs: TextRunPosition[];
}

export async function convertPdfToWord(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertPdfInput(file);
  const pdf = await loadPdf(file);

  try {
    const paragraphs = await extractParagraphs(pdf);
    if (paragraphs.length === 0) {
      throw new Error('No readable text was found in this PDF.');
    }

    const document = new Document({
      creator: 'IHatePDF',
      title: 'Converted PDF',
      sections: [{ children: paragraphs }],
    });

    return Packer.toArrayBuffer(document);
  } finally {
    await pdf.destroy();
  }
}

function assertPdfInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty PDF to Word.');
  }
}

async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data, verbosity: VerbosityLevel.ERRORS }).promise;
  } catch (error) {
    throw new Error(error instanceof Error ? `Unable to read PDF for Word conversion: ${error.message}` : 'Unable to read PDF for Word conversion.');
  }
}

async function extractParagraphs(pdf: PDFDocumentProxy): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = groupTextLines(content.items.filter(isPdfTextItem).map(toTextRunPosition));
    paragraphs.push(...lines.map(createParagraph));
    page.cleanup();
  }

  return paragraphs;
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  if (typeof item !== 'object' || item === null) return false;

  const candidate = item as Partial<PdfTextItem>;
  return typeof candidate.str === 'string'
    && Array.isArray(candidate.transform)
    && candidate.transform.length >= 6;
}

function toTextRunPosition(item: PdfTextItem): TextRunPosition {
  return {
    text: item.str.replace(/\s+/g, ' ').trim(),
    x: item.transform[4],
    y: item.transform[5],
    size: Math.max(Math.round(Math.abs(item.transform[0]) * 2), DEFAULT_FONT_SIZE),
  };
}

function groupTextLines(runs: TextRunPosition[]): TextLine[] {
  const lines: TextLine[] = [];

  runs.filter((run) => run.text.length > 0)
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .forEach((run) => addRunToLine(lines, run));

  return lines.map((line) => ({
    y: line.y,
    runs: [...line.runs].sort((a, b) => a.x - b.x),
  }));
}

function addRunToLine(lines: TextLine[], run: TextRunPosition): void {
  const line = lines.find((entry) => Math.abs(entry.y - run.y) <= LINE_Y_TOLERANCE);

  if (line) {
    line.runs.push(run);
    return;
  }

  lines.push({ y: run.y, runs: [run] });
}

function createParagraph(line: TextLine): Paragraph {
  return new Paragraph({
    children: line.runs.map((run, index) => new TextRun({
      text: `${index === 0 ? '' : ' '}${run.text}`,
      size: run.size,
    })),
    spacing: { after: 120 },
  });
}

import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const LINE_Y_TOLERANCE = 4;
const DEFAULT_FONT_SIZE = 22;

GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

interface PdfTextItem extends TextItem {
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
    const lines = await extractTextLines(pdf);
    if (lines.length === 0) {
      throw new Error('No readable text was found in this PDF.');
    }

    return createDocx(lines);
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

async function extractTextLines(pdf: PDFDocumentProxy): Promise<TextLine[]> {
  const textLines: TextLine[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const textItems = content.items.filter((item): item is PdfTextItem => isPdfTextItem(item));
    const lines = groupTextLines(textItems.map(toTextRunPosition));
    textLines.push(...lines);
    page.cleanup();
  }

  return textLines;
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

async function createDocx(lines: TextLine[]): Promise<ArrayBuffer> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const document = new Document({
    creator: 'IHatePDF',
    title: 'Converted PDF',
    sections: [{
      children: lines.map((line) => new Paragraph({
        children: line.runs.map((run, index) => new TextRun({
          text: `${index === 0 ? '' : ' '}${run.text}`,
          size: run.size,
        })),
        spacing: { after: 120 },
      })),
    }],
  });

  return Packer.toArrayBuffer(document);
}

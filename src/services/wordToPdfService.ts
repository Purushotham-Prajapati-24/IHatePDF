import * as mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 54;
const BODY_SIZE = 11;
const HEADING_SIZE = 18;
const LINE_HEIGHT = 15;
const HEADING_LINE_HEIGHT = 24;

interface TextBlock {
  text: string;
  kind: 'heading' | 'paragraph' | 'bullet';
}

interface DrawContext {
  pdf: PDFDocument;
  page: PDFPage;
  bodyFont: PDFFont;
  boldFont: PDFFont;
  y: number;
}

export async function convertWordToPdf(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertDocxInput(file);
  const result = await mammoth.convertToHtml({ arrayBuffer: file });
  const blocks = parseHtmlBlocks(result.value);

  if (blocks.length === 0) {
    throw new Error('No readable Word document content was found.');
  }

  return renderBlocksToPdf(blocks);
}

function assertDocxInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty Word document.');
  }
}

async function renderBlocksToPdf(blocks: TextBlock[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const context: DrawContext = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    bodyFont: await pdf.embedFont(StandardFonts.Helvetica),
    boldFont: await pdf.embedFont(StandardFonts.HelveticaBold),
    y: PAGE_HEIGHT - PAGE_MARGIN,
  };

  blocks.forEach((block) => drawBlock(context, block));
  return toExactArrayBuffer(await pdf.save());
}

function drawBlock(context: DrawContext, block: TextBlock): void {
  const font = block.kind === 'heading' ? context.boldFont : context.bodyFont;
  const size = block.kind === 'heading' ? HEADING_SIZE : BODY_SIZE;
  const lineHeight = block.kind === 'heading' ? HEADING_LINE_HEIGHT : LINE_HEIGHT;
  const indent = block.kind === 'bullet' ? 16 : 0;
  const lines = wrapText(block.text, font, size, PAGE_WIDTH - PAGE_MARGIN * 2 - indent);

  ensurePageSpace(context, lineHeight * lines.length + 8);
  lines.forEach((line, index) => {
    const prefix = block.kind === 'bullet' && index === 0 ? '- ' : '';
    context.page.drawText(`${prefix}${line}`, {
      x: PAGE_MARGIN + indent,
      y: context.y,
      size,
      font,
      color: rgb(0.07, 0.07, 0.07),
    });
    context.y -= lineHeight;
  });
  context.y -= block.kind === 'heading' ? 8 : 4;
}

function ensurePageSpace(context: DrawContext, neededHeight: number): void {
  if (context.y - neededHeight >= PAGE_MARGIN) {
    return;
  }

  context.page = context.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.y = PAGE_HEIGHT - PAGE_MARGIN;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
      return;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

function parseHtmlBlocks(html: string): TextBlock[] {
  if (typeof DOMParser === 'undefined') {
    return parseHtmlBlocksWithoutDom(html);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const blocks: TextBlock[] = [];

  document.body.childNodes.forEach((node) => collectBlocks(node, blocks));
  return blocks.filter((block) => block.text.length > 0);
}

function parseHtmlBlocksWithoutDom(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const blockPattern = /<(h[1-6]|p|li|td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of html.matchAll(blockPattern)) {
    const tagName = match[1].toLowerCase();
    const text = normalizeText(stripHtml(match[2]));
    const kind = tagName.startsWith('h') ? 'heading' : tagName === 'li' ? 'bullet' : 'paragraph';
    blocks.push({ text, kind });
  }

  return blocks.filter((block) => block.text.length > 0);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

function collectBlocks(node: ChildNode, blocks: TextBlock[]): void {
  if (!(node instanceof HTMLElement)) {
    const text = normalizeText(node.textContent ?? '');
    if (text) blocks.push({ text, kind: 'paragraph' });
    return;
  }

  if (/^H[1-6]$/.test(node.tagName)) {
    blocks.push({ text: normalizeText(node.textContent ?? ''), kind: 'heading' });
    return;
  }

  if (node.tagName === 'LI') {
    blocks.push({ text: normalizeText(node.textContent ?? ''), kind: 'bullet' });
    return;
  }

  if (node.tagName === 'P' || node.tagName === 'TD' || node.tagName === 'TH') {
    blocks.push({ text: normalizeText(node.textContent ?? ''), kind: 'paragraph' });
    return;
  }

  node.childNodes.forEach((child) => collectBlocks(child, blocks));
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

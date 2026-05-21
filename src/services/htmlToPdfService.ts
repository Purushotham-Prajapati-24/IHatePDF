import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 54;
const BODY_SIZE = 11;
const HEADING_SIZE = 18;
const LINE_HEIGHT = 15;

interface HtmlBlock {
  text: string;
  kind: 'heading' | 'paragraph' | 'bullet';
}

interface HtmlDrawContext {
  pdf: PDFDocument;
  page: PDFPage;
  bodyFont: PDFFont;
  boldFont: PDFFont;
  y: number;
}

export async function convertHtmlToPdf(file: ArrayBuffer): Promise<ArrayBuffer> {
  const html = new TextDecoder().decode(assertHtmlInput(file));
  const blocks = parseHtmlBlocks(html);

  if (blocks.length === 0) {
    throw new Error('No readable HTML content was found.');
  }

  return renderHtmlBlocks(blocks);
}

function assertHtmlInput(file: ArrayBuffer): ArrayBuffer {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty HTML file.');
  }
  return file;
}

async function renderHtmlBlocks(blocks: HtmlBlock[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const context: HtmlDrawContext = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    bodyFont: await pdf.embedFont(StandardFonts.Helvetica),
    boldFont: await pdf.embedFont(StandardFonts.HelveticaBold),
    y: PAGE_HEIGHT - PAGE_MARGIN,
  };

  blocks.forEach((block) => drawBlock(context, block));
  return toExactArrayBuffer(await pdf.save());
}

function drawBlock(context: HtmlDrawContext, block: HtmlBlock): void {
  const font = block.kind === 'heading' ? context.boldFont : context.bodyFont;
  const size = block.kind === 'heading' ? HEADING_SIZE : BODY_SIZE;
  const lines = wrapText(block.text, font, size, PAGE_WIDTH - PAGE_MARGIN * 2 - (block.kind === 'bullet' ? 14 : 0));

  ensurePageSpace(context, lines.length * LINE_HEIGHT + 10);
  lines.forEach((line, index) => {
    const prefix = block.kind === 'bullet' && index === 0 ? '- ' : '';
    context.page.drawText(`${prefix}${line}`, {
      x: PAGE_MARGIN + (block.kind === 'bullet' ? 14 : 0),
      y: context.y,
      size,
      font,
      color: rgb(0.07, 0.07, 0.07),
    });
    context.y -= block.kind === 'heading' ? 22 : LINE_HEIGHT;
  });
  context.y -= block.kind === 'heading' ? 8 : 4;
}

function ensurePageSpace(context: HtmlDrawContext, neededHeight: number): void {
  if (context.y - neededHeight >= PAGE_MARGIN) return;

  context.page = context.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.y = PAGE_HEIGHT - PAGE_MARGIN;
}

function parseHtmlBlocks(html: string): HtmlBlock[] {
  const body = extractBody(html);
  const blocks = Array.from(body.matchAll(/<(h[1-6]|p|li|td|th|div|section|article)\b[^>]*>([\s\S]*?)<\/\1>/gi))
    .map((match) => createBlock(match[1].toLowerCase(), match[2]))
    .filter((block): block is HtmlBlock => block !== null);

  if (blocks.length > 0) return blocks;

  const text = normalizeText(stripTags(body));
  return text ? [{ text, kind: 'paragraph' }] : [];
}

function createBlock(tagName: string, html: string): HtmlBlock | null {
  const text = normalizeText(stripTags(html));
  if (!text) return null;

  if (tagName.startsWith('h')) return { text, kind: 'heading' };
  if (tagName === 'li') return { text, kind: 'bullet' };
  return { text, kind: 'paragraph' };
}

function extractBody(html: string): string {
  return html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function decodeHtml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      line = nextLine;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  return lines;
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

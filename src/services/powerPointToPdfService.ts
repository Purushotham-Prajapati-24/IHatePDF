import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const SLIDE_WIDTH = 720;
const SLIDE_HEIGHT = 405;
const PAGE_MARGIN = 42;

interface PptxSlide {
  index: number;
  texts: string[];
  images: PptxImage[];
}

interface PptxImage {
  name: string;
  data: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
}

export async function convertPowerPointToPdf(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertPptxInput(file);
  const zip = await JSZip.loadAsync(file);
  const slides = await readSlides(zip);

  if (slides.length === 0) {
    throw new Error('No slides were found in this PowerPoint file.');
  }

  return renderSlidesToPdf(slides);
}

function assertPptxInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty PowerPoint file.');
  }
}

async function readSlides(zip: JSZip): Promise<PptxSlide[]> {
  const slideFiles = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort(compareSlidePaths);

  return Promise.all(slideFiles.map(async (path) => readSlide(zip, path)));
}

async function readSlide(zip: JSZip, path: string): Promise<PptxSlide> {
  const xml = await zip.file(path)?.async('text');

  if (!xml) {
    throw new Error(`PowerPoint slide could not be read: ${path}.`);
  }

  return {
    index: getSlideIndex(path),
    texts: extractSlideTexts(xml),
    images: await readSlideImages(zip, path),
  };
}

async function readSlideImages(zip: JSZip, slidePath: string): Promise<PptxImage[]> {
  const relationshipPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
  const relationshipXml = await zip.file(relationshipPath)?.async('text');

  if (!relationshipXml) {
    return [];
  }

  const imageTargets = extractImageTargets(relationshipXml);
  const images = await Promise.all(imageTargets.map((target) => readImage(zip, resolveSlideTarget(target))));
  return images.filter((image): image is PptxImage => image !== null);
}

async function readImage(zip: JSZip, path: string): Promise<PptxImage | null> {
  const mimeType = getImageMimeType(path);

  if (!mimeType) {
    return null;
  }

  const file = zip.file(path);
  if (!file) return null;

  return {
    name: path.split('/').pop() ?? 'image',
    data: await file.async('uint8array'),
    mimeType,
  };
}

function extractSlideTexts(xml: string): string[] {
  return Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g))
    .map((match) => decodeXml(match[1]))
    .map((text) => text.trim())
    .filter(Boolean);
}

function extractImageTargets(xml: string): string[] {
  return Array.from(xml.matchAll(/Target="([^"]+\.(?:png|jpe?g))"/gi)).map((match) => decodeXml(match[1]));
}

function resolveSlideTarget(target: string): string {
  const normalized = target.replace(/\\/g, '/');
  return normalized.startsWith('../') ? `ppt/${normalized.slice(3)}` : `ppt/slides/${normalized}`;
}

async function renderSlidesToPdf(slides: PptxSlide[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const slide of slides) {
    const page = pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT]);
    await drawSlide(pdf, page, slide, bodyFont, titleFont);
  }

  return toExactArrayBuffer(await pdf.save());
}

async function drawSlide(
  pdf: PDFDocument,
  page: PDFPage,
  slide: PptxSlide,
  bodyFont: PDFFont,
  titleFont: PDFFont,
): Promise<void> {
  page.drawRectangle({ x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, color: rgb(1, 1, 1) });
  drawSlideText(page, slide, bodyFont, titleFont);

  for (const [index, image] of slide.images.entries()) {
    await drawSlideImage(pdf, page, image, index);
  }
}

function drawSlideText(page: PDFPage, slide: PptxSlide, bodyFont: PDFFont, titleFont: PDFFont): void {
  const [title, ...body] = slide.texts.length > 0 ? slide.texts : [`Slide ${slide.index}`];
  page.drawText(title, { x: PAGE_MARGIN, y: SLIDE_HEIGHT - 72, size: 24, font: titleFont, color: rgb(0.07, 0.07, 0.07) });

  let y = SLIDE_HEIGHT - 116;
  body.forEach((text) => {
    wrapText(text, bodyFont, 14, SLIDE_WIDTH - PAGE_MARGIN * 2).forEach((line) => {
      page.drawText(line, { x: PAGE_MARGIN, y, size: 14, font: bodyFont, color: rgb(0.12, 0.12, 0.12) });
      y -= 20;
    });
    y -= 4;
  });
}

async function drawSlideImage(pdf: PDFDocument, page: PDFPage, image: PptxImage, index: number): Promise<void> {
  const embeddedImage = image.mimeType === 'image/png'
    ? await pdf.embedPng(image.data)
    : await pdf.embedJpg(image.data);
  const maxWidth = 160;
  const maxHeight = 110;
  const scale = Math.min(maxWidth / embeddedImage.width, maxHeight / embeddedImage.height, 1);
  const width = embeddedImage.width * scale;
  const height = embeddedImage.height * scale;
  const x = SLIDE_WIDTH - PAGE_MARGIN - width;
  const y = PAGE_MARGIN + index * (maxHeight + 12);

  if (y + height <= SLIDE_HEIGHT - PAGE_MARGIN) {
    page.drawImage(embeddedImage, { x, y, width, height });
  }
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
  return lines;
}

function compareSlidePaths(left: string, right: string): number {
  return getSlideIndex(left) - getSlideIndex(right);
}

function getSlideIndex(path: string): number {
  return Number(path.match(/slide(\d+)\.xml$/i)?.[1] ?? 0);
}

function getImageMimeType(path: string): PptxImage['mimeType'] | null {
  const lowerPath = path.toLowerCase();

  if (lowerPath.endsWith('.png')) return 'image/png';
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

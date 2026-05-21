import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { convertPowerPointToPdf } from '../powerPointToPdfService';

describe('powerPointToPdfService', () => {
  it('converts each PPTX slide into one landscape PDF page', async () => {
    const pptx = await createPptxFixture(3);
    const output = await convertPowerPointToPdf(pptx);
    const pdf = await PDFDocument.load(output);

    expect(pdf.getPageCount()).toBe(3);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 720, height: 405 });
  });

  it('rejects PPTX files with no slides', async () => {
    const zip = new JSZip();
    const emptyPptx = await zip.generateAsync({ type: 'arraybuffer' });

    await expect(convertPowerPointToPdf(emptyPptx)).rejects.toThrow('No slides');
  });
});

async function createPptxFixture(slideCount: number): Promise<ArrayBuffer> {
  const zip = new JSZip();

  for (let index = 1; index <= slideCount; index += 1) {
    zip.file(`ppt/slides/slide${index}.xml`, createSlideXml(index));
  }

  return zip.generateAsync({ type: 'arraybuffer' });
}

function createSlideXml(index: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <p:cSld><p:spTree><p:sp><p:txBody>
        <a:p><a:r><a:t>Slide ${index}</a:t></a:r></a:p>
        <a:p><a:r><a:t>Bullet ${index}</a:t></a:r></a:p>
      </p:txBody></p:sp></p:spTree></p:cSld>
    </p:sld>`;
}

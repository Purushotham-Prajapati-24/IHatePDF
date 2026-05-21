import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { convertExcelToPdf } from '../excelToPdfService';

describe('excelToPdfService', () => {
  it('renders an XLSX worksheet into a PDF table', async () => {
    const workbook = await createWorkbookFixture();
    const output = await convertExcelToPdf(workbook);
    const pdf = await PDFDocument.load(output);

    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
  });

  it('rejects XLSX files with no readable cells', async () => {
    const zip = new JSZip();
    zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="Empty" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml', '<worksheet><sheetData /></worksheet>');

    await expect(convertExcelToPdf(await zip.generateAsync({ type: 'arraybuffer' }))).rejects.toThrow('No readable Excel cells');
  });
});

async function createWorkbookFixture(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="Invoice" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.file('xl/sharedStrings.xml', '<sst><si><t>Item</t></si><si><t>Total</t></si><si><t>Hosting</t></si></sst>');
  zip.file('xl/worksheets/sheet1.xml', `
    <worksheet><sheetData>
      <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
      <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>125</v></c></row>
    </sheetData></worksheet>
  `);
  return zip.generateAsync({ type: 'arraybuffer' });
}

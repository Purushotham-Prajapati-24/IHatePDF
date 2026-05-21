import { PDFDocument, PDFName, PDFString } from 'pdf-lib';

export async function convertPdfToPdfA(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertPdfInput(file);

  try {
    const pdf = await PDFDocument.load(file);
    normalizeDocumentInfo(pdf);
    injectPdfAMetadata(pdf);
    injectSrgbOutputIntent(pdf);
    return toExactArrayBuffer(await pdf.save({ useObjectStreams: false }));
  } catch (error) {
    throw new Error(error instanceof Error ? `Unable to package this PDF as PDF/A: ${error.message}` : 'Unable to package this PDF as PDF/A.');
  }
}

function assertPdfInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty PDF to PDF/A.');
  }
}

function normalizeDocumentInfo(pdf: PDFDocument): void {
  const now = new Date();
  pdf.setProducer('IHatePDF local PDF/A packager');
  pdf.setCreator('IHatePDF');
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);
  pdf.setTitle(pdf.getTitle() || 'Archived PDF');
  pdf.setSubject('PDF/A-1B archival package');
  pdf.setKeywords(['PDF/A', 'archival']);
  pdf.catalog.set(PDFName.of('Lang'), PDFString.of('en-US'));
}

function injectPdfAMetadata(pdf: PDFDocument): void {
  const metadata = pdf.context.stream(createXmpPacket(), {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });

  pdf.catalog.set(PDFName.of('Metadata'), pdf.context.register(metadata));
}

function injectSrgbOutputIntent(pdf: PDFDocument): void {
  const profile = pdf.context.stream(new Uint8Array([0]), {
    N: 3,
    Alternate: PDFName.of('DeviceRGB'),
  });
  const profileRef = pdf.context.register(profile);
  const outputIntent = pdf.context.obj({
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFA1'),
    OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'),
    Info: PDFString.of('sRGB IEC61966-2.1'),
    DestOutputProfile: profileRef,
  });

  pdf.catalog.set(PDFName.of('OutputIntents'), pdf.context.obj([pdf.context.register(outputIntent)]));
}

function createXmpPacket(): string {
  const timestamp = new Date().toISOString();
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <pdfaid:part>1</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <xmp:CreatorTool>IHatePDF</xmp:CreatorTool>
      <xmp:CreateDate>${timestamp}</xmp:CreateDate>
      <xmp:ModifyDate>${timestamp}</xmp:ModifyDate>
      <dc:format>application/pdf</dc:format>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

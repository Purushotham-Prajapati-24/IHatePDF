export function selectEngine({ tool, mode }) {
  if (mode === 'local-only') return 'browser';

  switch (tool) {
    case 'wordToPdf':
    case 'powerPointToPdf':
    case 'excelToPdf':
      return 'libreoffice';
    case 'htmlToPdf':
      return 'chromium';
    case 'pdfToJpg':
      return 'pdfium';
    case 'pdfToWord':
    case 'pdfToExcel':
    case 'pdfToPowerPoint':
      return 'docling';
    default:
      throw Object.assign(new Error(`Unsupported conversion tool: ${tool}`), { statusCode: 400 });
  }
}

export function targetExtension(mimeType) {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/zip') return 'zip';
  if (mimeType.includes('wordprocessingml')) return 'docx';
  if (mimeType.includes('presentationml')) return 'pptx';
  if (mimeType.includes('spreadsheetml')) return 'xlsx';
  return 'bin';
}

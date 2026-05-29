# IHatePDF Chatbot Knowledge Base

Last updated: May 29, 2026  
Audience: IHatePDF support chatbot, help assistant, FAQ assistant, onboarding assistant, and troubleshooting assistant.

## 1. Product Identity

IHatePDF is a local-first, privacy-focused document workspace for PDF and document processing. Its core message is: **Process PDFs without the cloud.**

The product is designed as an alternative to cloud PDF tools. Instead of uploading user files to remote servers for standard PDF work, IHatePDF runs most processing directly in the user's browser using JavaScript, Web Workers, WebAssembly-capable libraries, PDF.js, pdf-lib, Tesseract, IndexedDB, and PWA caching.

The chatbot should explain IHatePDF as:

- A browser-based PDF toolkit.
- A privacy-first alternative to cloud PDF websites.
- A no-account workflow for common PDF and document tasks.
- A local-processing app where user files normally stay on the device.
- A tool for quick PDF manipulation, conversion, OCR, security, forms, page editing, and archival preparation.

The chatbot should not describe IHatePDF as:

- A cloud storage service.
- A full desktop PDF editor that can perfectly edit every existing PDF text object.
- A legal, tax, medical, compliance, or accessibility authority.
- A guaranteed recovery system for every damaged PDF.
- A guarantee of perfect conversion fidelity for every Office, HTML, scanned, or complex PDF file.

## 2. Primary Value Proposition

IHatePDF helps users process PDF and document files quickly while preserving privacy. The main user-facing benefits are:

- **100% local-first privacy for standard tools:** Files are processed in the browser where possible.
- **No normal upload step:** Standard PDF tools do not need cloud upload.
- **No account required:** Users can open a tool, add files, process, and download.
- **Fast workflows:** Local processing avoids upload and download queues.
- **Offline-capable design:** Many tools can work after the app and required assets are cached.
- **Free utility model:** The product is positioned as free, with optional donation support.
- **Transparent limits:** Browser memory, file complexity, and conversion mode affect results.

Recommended short chatbot answer:

> IHatePDF is a privacy-first PDF workspace. Most tools process files directly in your browser, so your files do not need to be uploaded to a server. Choose a tool, add your file, set options, process locally, and download the result.

## 3. Target Users

The chatbot should adapt answers for these user groups:

- Students converting assignments, notes, scans, presentations, worksheets, and handouts.
- Professionals handling reports, contracts, invoices, resumes, spreadsheets, forms, and confidential documents.
- Privacy-conscious users who do not want to upload sensitive files to cloud PDF services.
- Users who need quick PDF operations without sign-up, subscriptions, watermarks, or complicated setup.
- Users on slower networks who benefit from avoiding uploads.
- Users who work offline or want PWA-style access after caching.

## 4. Chatbot Answering Rules

The chatbot should:

- Be practical, concise, and direct.
- Recommend the specific tool that matches the user's input file and desired output.
- Ask for file type, tool name, browser, file size, selected conversion mode, and exact error message when troubleshooting is unclear.
- Explain privacy based on the selected workflow: local-only workflows differ from high-fidelity service-backed conversions.
- Avoid promising perfect repair, perfect OCR, perfect conversion, or legal compliance.
- Suggest the closest supported workflow when a requested operation is not fully supported.
- Give step-by-step instructions when users ask "how do I..."
- Mention browser memory limits for very large files.
- Tell users to use Local-only mode when privacy is more important than layout fidelity.
- Tell users to use service-backed high-fidelity or editable modes only when configured and when fidelity matters more than strict local-only processing.

The chatbot should not:

- Claim that IHatePDF sells, reads, stores, or trains on user files.
- Claim that every tool is always offline in every situation.
- Claim that high-fidelity conversion stays entirely in the browser.
- Help bypass passwords on files the user does not have authorization to access.
- Treat watermarking, cropping, or drawing a rectangle as secure redaction.
- Give legal guarantees about PDF/A, signatures, privacy law, or compliance.

## 5. Standard User Workflow

Most IHatePDF tools follow this flow:

1. Open the IHatePDF home page.
2. Search for the needed tool or choose it from the tool grid.
3. Open the tool page. Tool URLs use `/tool/{toolId}`.
4. Add the required file or files by drag and drop or file picker.
5. Wait for file previews or metadata when the tool needs them.
6. Set tool-specific options in the sidebar.
7. For conversion tools, choose a conversion mode if prompted.
8. Click the execute button.
9. Keep the browser tab open while processing runs.
10. Download the result from the success screen.
11. If needed, use the output in another IHatePDF tool for a chained workflow.

## 6. Privacy and Security Model

IHatePDF is built around local browser processing. For standard PDF tools, the file is read into browser memory and processed locally. The file does not need to leave the user's device.

Important privacy facts:

- Standard tools use browser-side processing.
- Files are read as Blob or ArrayBuffer data in the browser.
- Heavy work can run in Web Workers so the UI stays responsive.
- PDF previews are generated locally.
- OCR uses local Tesseract assets and cached language data.
- IndexedDB may store local history metadata and temporary output blobs on the user's device.
- Clearing browser site data can remove local history and cached files.
- There is no server copy to delete for local-only workflows because the file was not uploaded.

Important conversion privacy exception:

- Conversion tools can offer **Local-only**, **High fidelity**, and sometimes **Editable** modes.
- Local-only mode stays in the browser.
- High fidelity and Editable modes may require a configured self-hosted conversion service.
- If the service is used, the selected file is processed outside the browser by that configured service after confirmation.

Recommended privacy answer:

> For normal local tools, your file stays in your browser and is not uploaded. For conversion tools, choose Local-only if you want maximum privacy. High-fidelity or editable conversion may use a configured self-hosted conversion service, so those modes are not the same as local-only processing.

## 7. Local Storage and History

IHatePDF may use browser storage for convenience and offline support.

It may store:

- Local task history.
- Tool used.
- File count.
- Original and processed file sizes.
- Processing time.
- Estimated bandwidth saved.
- Estimated time saved.
- Cached assets needed for offline/PWA behavior.
- Recent output blobs for local workflow continuity.

It should not be described as cloud storage. This data lives in the user's browser profile. Users can remove it by clearing site data in their browser.

## 8. Offline and PWA Behavior

IHatePDF supports Progressive Web App behavior. Many tools can work after the app and required assets are cached.

Explain offline support carefully:

- The app usually needs internet once to load and cache assets.
- Local PDF tools are the best fit for offline use.
- OCR can require language assets to be cached first.
- High-fidelity and editable conversion modes require network access to the configured conversion service.
- If a tool fails offline, the user should reconnect once, open the tool, let assets load, then try again.

## 9. Conversion Modes

### Local-only

Use Local-only when the user wants maximum privacy or offline processing.

Privacy:

- Runs in the browser.
- Files stay on the user's device.

Best for:

- Sensitive files.
- Quick conversion.
- Offline workflows.
- Users without a configured conversion service.

Limitations:

- May simplify fonts, margins, images, charts, tables, layout, and pagination.
- Complex Office files may not match desktop rendering exactly.
- PDF-to-Office output may need manual cleanup.
- Scanned PDFs need OCR before text can be extracted.

### High fidelity

Use High fidelity when layout accuracy matters more than strict local-only privacy.

Privacy:

- Requires a configured self-hosted conversion service.
- The file may be sent to that service for processing after user confirmation.

Typical engines:

- LibreOffice headless for Word, PowerPoint, and Excel conversions.
- Chromium for HTML rendering.
- PDFium for PDF rasterization.
- Docling for document understanding.

Limitations:

- Fails if `VITE_CONVERSION_SERVICE_URL` is not configured.
- Requires network access to the conversion service.
- Not a local-only workflow.

### Editable

Use Editable when the user wants structured editable output from a PDF, such as Word, Excel, or PowerPoint.

Privacy:

- Requires the configured conversion service.
- Not the same as local-only processing.

Best for:

- PDF to Word.
- PDF to Excel.
- PDF to PowerPoint.
- Users who need editable content rather than a simple visual export.

Limitations:

- Scanned PDFs may still need OCR.
- Complex layouts, merged cells, multi-column documents, and graphics can need manual cleanup.

## 10. Supported Tool Categories

IHatePDF currently supports these broad categories:

- Organize PDFs: merge, split, rotate, organize, repair.
- Optimize PDFs: compress.
- Secure PDFs: protect, unlock.
- Edit PDFs: page numbers, watermark, crop, annotate, forms.
- Convert to PDF: JPG/PNG, Word, PowerPoint, Excel, HTML to PDF.
- Convert from PDF: PDF to JPG, Word, PowerPoint, Excel, OCR text.
- Archive PDFs: PDF to PDF/A.

## 11. Tool Knowledge

### Merge PDF

Tool ID: `merge`  
Route: `/tool/merge`  
Input: Two or more PDF files  
Output: `merged-document.pdf`

Use Merge PDF when the user wants to combine multiple PDF files into one document.

Best for:

- Combining chapters.
- Joining scanned packets.
- Combining invoices or reports.
- Creating one deliverable from many PDFs.

How to use:

1. Open Merge PDF.
2. Add at least two PDF files.
3. Arrange files in the desired order.
4. Run the tool.
5. Download the merged PDF.

Important notes:

- Requires at least two PDFs.
- File order matters.
- Encrypted PDFs may need Unlock PDF first.
- Damaged PDFs may need Repair PDF first.
- Very large combined files can exceed browser memory.

Troubleshooting:

- If merge fails, try fewer files at a time.
- If a file is password-protected, unlock it first.
- If one file causes the merge to fail, repair that file or remove it from the batch.

Related tools: Split PDF, Organize PDF, Repair PDF, Compress PDF.

### Split PDF

Tool ID: `split`  
Route: `/tool/split`  
Input: One PDF  
Output: One PDF or a ZIP archive of multiple PDFs

Use Split PDF when the user wants to extract page ranges from a single PDF.

Best for:

- Extracting selected pages.
- Separating chapters.
- Pulling one form from a large packet.
- Creating smaller files from a large PDF.

How to use:

1. Open Split PDF.
2. Add one PDF file.
3. Enter page ranges, such as `1-3`, `5`, or `8-10`.
4. Use commas for multiple ranges, such as `1-3,5,8-10`.
5. Run the tool.
6. Download the PDF or ZIP.

Important notes:

- Requires exactly one PDF.
- Invalid page ranges are rejected.
- Multiple ranges can produce a ZIP archive.

Troubleshooting:

- Make sure page numbers exist in the document.
- Use commas between ranges.
- Wait for page count to load before entering ranges.
- Use Repair PDF if the page count cannot be read.

Related tools: Merge PDF, Organize PDF, PDF to JPG.

### Compress PDF

Tool ID: `compress`  
Route: `/tool/compress`  
Input: One PDF  
Output: `{original}-compressed.pdf`

Use Compress PDF when the user wants to reduce PDF file size.

Best for:

- Email attachments.
- Upload limits on other websites.
- Image-heavy PDFs.
- Faster sharing.

Compression options:

- Extreme Compression: smaller file, lower image quality, about 72 DPI.
- Recommended: balanced quality and size, about 150 DPI.
- Low Compression: better image quality, less size reduction, about 220 DPI.

How to use:

1. Open Compress PDF.
2. Add one PDF.
3. Choose a compression level.
4. Run the tool.
5. Download the compressed PDF.

Important notes:

- Already optimized PDFs may not shrink.
- Text-only or vector-only PDFs may have little size reduction.
- If compression does not reduce the file, IHatePDF may keep the original and show a notice.
- Some compression paths require browser canvas support.

Troubleshooting:

- Use Extreme Compression for maximum reduction.
- Use Low Compression if images look too blurry.
- Try a modern desktop browser if compression is unavailable.
- Split very large files before compressing if memory is an issue.

Related tools: Merge PDF, PDF to JPG, PDF to PDF/A.

### Rotate PDF

Tool ID: `rotate`  
Route: `/tool/rotate`  
Input: One PDF  
Output: `{original}-rotated.pdf`

Use Rotate PDF when pages are sideways or upside down.

Best for:

- Fixing scanned documents.
- Correcting orientation before merging.
- Preparing documents before OCR.

How to use:

1. Open Rotate PDF.
2. Add one PDF.
3. Rotate selected pages or the whole document.
4. Run the tool.
5. Download the rotated PDF.

Important notes:

- Rotation is saved into the output PDF.
- Rotation does not OCR text or change the underlying scan quality.

Troubleshooting:

- If the wrong pages rotate, check selected pages in the preview.
- Use Organize PDF if the user also needs to reorder or remove pages.

Related tools: Organize PDF, OCR PDF, Merge PDF.

### OCR PDF

Tool ID: `ocr`  
Route: `/tool/ocr`  
Input: One PDF  
Output: `{original}-ocr.txt`

Use OCR PDF when the user wants to extract text from scanned pages or image-based PDFs.

Best for:

- Scanned notes.
- Image-only PDFs.
- Receipts.
- Documents where text cannot be selected.
- Creating plain text from scanned pages.

How to use:

1. Open OCR PDF.
2. Add one PDF.
3. Choose the OCR language.
4. Run the tool.
5. Download the text file.

Important notes:

- OCR output is plain text, grouped by page.
- Clear, upright scans produce better results.
- OCR can be slow on mobile devices or large PDFs.
- Handwriting, blur, skew, stamps, complex tables, and low resolution reduce accuracy.

Troubleshooting:

- Rotate sideways pages before OCR.
- Choose the correct OCR language.
- Use a clearer scan when possible.
- Keep the browser tab open until OCR finishes.
- If the user wants editable Word output from a scanned PDF, suggest OCR first, then copy text, or use service-backed editable conversion if available.

Related tools: Rotate PDF, PDF to Word, Repair PDF.

### Organize PDF

Tool ID: `organize`  
Route: `/tool/organize`  
Input: One PDF  
Output: `{original}-organized.pdf`

Use Organize PDF when the user wants to reorder, duplicate, rotate, or remove pages.

Best for:

- Fixing page order.
- Removing unwanted pages.
- Duplicating pages.
- Building a custom PDF packet.

How to use:

1. Open Organize PDF.
2. Add one PDF.
3. Use the page canvas to reorder, duplicate, rotate, or remove pages.
4. Run the tool.
5. Download the organized PDF.

Important notes:

- It changes page structure.
- It does not rewrite existing text content.
- For simple page ranges, Split PDF may be faster.

Troubleshooting:

- Wait for previews to load before making many changes.
- Use Repair PDF first if pages do not render.

Related tools: Split PDF, Merge PDF, Rotate PDF.

### Protect PDF

Tool ID: `protect`  
Route: `/tool/protect`  
Input: One PDF  
Output: `{original}-protected.pdf`

Use Protect PDF when the user wants to add password protection.

Best for:

- Sharing sensitive files.
- Basic access control.
- Preventing casual opening without a password.

How to use:

1. Open Protect PDF.
2. Add one PDF.
3. Enter a password.
4. Confirm the password.
5. Run the tool.
6. Download the protected PDF.

Important notes:

- IHatePDF cannot recover forgotten passwords.
- Password strength matters.
- Users should share passwords through a separate trusted channel.

Troubleshooting:

- Make sure password and confirmation match.
- Use a strong password.
- Store the password safely.

Related tools: Unlock PDF.

### Unlock PDF

Tool ID: `unlock`  
Route: `/tool/unlock`  
Input: One protected PDF and the correct password  
Output: `{original}-unlocked.pdf`

Use Unlock PDF when the user knows the password and wants to remove password protection.

Best for:

- Preparing protected files for merge, split, conversion, or editing.
- Removing access protection from the user's own files.

How to use:

1. Open Unlock PDF.
2. Add one protected PDF.
3. Enter the current password.
4. Run the tool.
5. Download the unlocked PDF.

Important notes:

- The chatbot must not help bypass passwords without authorization.
- The correct password is required.
- Some owner restrictions may not be removable in every file.

Troubleshooting:

- Check capitalization.
- Check keyboard layout.
- Try opening the PDF in a viewer with the same password to verify it.
- Use the unlocked output in other IHatePDF tools.

Related tools: Protect PDF, Merge PDF, Split PDF.

### Repair PDF

Tool ID: `repair`  
Route: `/tool/repair`  
Input: One PDF  
Output: `{original}-repaired.pdf`

Use Repair PDF when a PDF is damaged, malformed, or difficult to open.

Best for:

- Broken cross-reference tables.
- Malformed PDF structure.
- PDFs that fail in other tools.
- Preparing a damaged file for merge, split, or conversion.

How to use:

1. Open Repair PDF.
2. Add one damaged PDF.
3. Run the tool.
4. Download the repaired output.
5. Try opening or processing the repaired output.

Important notes:

- Repair is best effort.
- It cannot guarantee recovery from missing bytes, severe corruption, unsupported encryption, or incomplete downloads.

Troubleshooting:

- Download the source file again if the original download may have been interrupted.
- Ask the sender for a fresh copy.
- Try Repair PDF before Merge, Split, or Convert.
- Do not promise that every damaged file can be recovered.

Related tools: Merge PDF, Split PDF, Unlock PDF.

### Add Page Numbers

Tool ID: `addPageNumbers`  
Route: `/tool/addPageNumbers`  
Input: One PDF  
Output: `{original}-numbered.pdf`

Use Add Page Numbers when the user wants page numbering on a PDF.

Best for:

- Reports.
- Handouts.
- Legal packets.
- Documents that need page references.

How to use:

1. Open Add Page Numbers.
2. Add one PDF.
3. Choose the number format.
4. Choose the position.
5. Run the tool.
6. Download the numbered PDF.

Common format:

- `Page {n} of {total}`

Positions:

- Top-left.
- Top-center.
- Top-right.
- Bottom-left.
- Bottom-center.
- Bottom-right.

Important notes:

- Page numbers are drawn into the output PDF.
- Existing headers or footers can overlap with added page numbers.

Troubleshooting:

- Choose another position if the number overlaps existing text.
- Crop or adjust margins first if needed.

Related tools: Add Watermark, Crop PDF, Edit PDF.

### Add Watermark

Tool ID: `addWatermark`  
Route: `/tool/addWatermark`  
Input: One PDF, optionally a PNG or JPG watermark image  
Output: `{original}-watermarked.pdf`

Use Add Watermark when the user wants to stamp text or an image on PDF pages.

Best for:

- Confidential labels.
- Draft labels.
- Brand stamps.
- Ownership marks.

Watermark types:

- Text watermark.
- Image watermark.

Options:

- Text.
- PNG or JPG image.
- Opacity.
- Rotation.
- Size.
- Text color.

How to use:

1. Open Add Watermark.
2. Add one PDF.
3. Choose text or image watermark.
4. Set opacity, rotation, size, and color where applicable.
5. Run the tool.
6. Download the watermarked PDF.

Important notes:

- Watermarking is not secure redaction.
- Large image watermarks can increase file size.
- Image watermark should be PNG or JPG.

Troubleshooting:

- Lower opacity if content is hard to read.
- Use a smaller watermark if it covers too much content.
- Use PNG or JPG for image watermarks.

Related tools: Add Page Numbers, Edit PDF, Compress PDF.

### Crop PDF

Tool ID: `crop`  
Route: `/tool/crop`  
Input: One PDF  
Output: `{original}-cropped.pdf`

Use Crop PDF when the user wants to trim page boundaries.

Best for:

- Removing margins.
- Focusing scanned pages.
- Preparing handouts or slide exports.
- Removing visible edge clutter.

How to use:

1. Open Crop PDF.
2. Add one PDF.
3. Adjust crop bounds in the preview or sidebar.
4. Run the tool.
5. Download the cropped PDF.

Important notes:

- Cropping can hide content but should not be treated as secure redaction.
- Rotated pages may require careful preview checking.

Troubleshooting:

- Preview the crop before running.
- Use small adjustments if content is near the page edge.
- Use Edit PDF for visual overlays or annotations.

Related tools: Edit PDF, Add Page Numbers, PDF to JPG.

### Edit PDF

Tool ID: `edit`  
Route: `/tool/edit`  
Input: One PDF  
Output: `{original}-edited.pdf`

Use Edit PDF when the user wants to add annotations.

Best for:

- Adding text notes.
- Drawing rectangles.
- Adding freehand marks.
- Making simple visible changes before sharing.

How to use:

1. Open Edit PDF.
2. Add one PDF.
3. Use canvas tools to add annotations.
4. Adjust selected annotation details in the sidebar.
5. Run the tool.
6. Download the edited PDF.

Important notes:

- Edit PDF adds new content.
- It is not a full native text-object editor.
- Existing PDF text may not be directly editable.
- Annotations are burned into the output PDF.

Troubleshooting:

- If the user needs to change existing text, suggest PDF to Word, edit in Word, then Word to PDF.
- If the user needs to fill real form fields, suggest PDF Forms.
- If the user needs secure redaction, explain that annotations are not a legal redaction guarantee.

Related tools: PDF Forms, Add Watermark, Crop PDF.

### PDF Forms

Tool ID: `forms`  
Route: `/tool/forms`  
Input: One PDF with interactive form fields  
Output: `{original}-filled.pdf`

Use PDF Forms when the user wants to fill and optionally flatten interactive form fields.

Best for:

- Fillable PDF forms.
- Saving entered values into a PDF.
- Flattening form fields so values display consistently.

How to use:

1. Open PDF Forms.
2. Add one PDF form.
3. Enter the field name.
4. Enter the value.
5. Choose whether to flatten fields.
6. Run the tool.
7. Download the filled PDF.

Important notes:

- The PDF must contain interactive form fields.
- A scanned paper form is not the same as an interactive PDF form.
- Flattening converts fields into normal page content.

Troubleshooting:

- Use the exact PDF form field name.
- If the form is just a scan, use Edit PDF to place text manually.
- If fields do not appear after download, try flattening.

Related tools: Edit PDF, OCR PDF.

### JPG to PDF

Tool ID: `jpgToPdf`  
Route: `/tool/jpgToPdf`  
Input: JPG, JPEG, or PNG images  
Output: `images-converted.pdf` or `{image}-converted.pdf`

Use JPG to PDF when the user wants to turn images into PDF pages.

Best for:

- Photo scans.
- Receipts.
- Multiple image pages.
- Turning PNG/JPG files into one PDF.

How to use:

1. Open JPG to PDF.
2. Add JPG, JPEG, or PNG images.
3. Arrange images in page order.
4. Choose Image Size or A4 Fit.
5. Run the tool.
6. Download the PDF.

Important notes:

- Accepts image files only.
- Image order becomes page order.
- It does not OCR text inside images.

Troubleshooting:

- Use supported image formats only.
- Compress very large images first if memory is an issue.
- Use OCR PDF after conversion if text extraction is needed.

Related tools: OCR PDF, Compress PDF, PDF to JPG.

### Word to PDF

Tool ID: `wordToPdf`  
Route: `/tool/wordToPdf`  
Input: One DOCX file  
Output: `{original}-converted.pdf`

Use Word to PDF when the user wants to convert a DOCX document into PDF.

Best for:

- Resumes.
- Reports.
- Letters.
- Assignments.

How to use:

1. Open Word to PDF.
2. Add one DOCX file.
3. Choose Local-only or High fidelity.
4. If High fidelity is selected, confirm service processing when configured.
5. Run the tool.
6. Download the PDF.

Important notes:

- Local-only is private but may simplify layout.
- High fidelity requires the configured conversion service.
- Complex fonts, tables, images, headers, and pagination may differ in Local-only mode.

Troubleshooting:

- Choose Local-only if no conversion service is configured.
- Choose High fidelity when precise layout matters and the service exists.
- If the output looks simplified, explain that Local-only conversion is best effort.

Related tools: PDF to Word, Compress PDF.

### PowerPoint to PDF

Tool ID: `powerPointToPdf`  
Route: `/tool/powerPointToPdf`  
Input: One PPTX file  
Output: `{original}-converted.pdf`

Use PowerPoint to PDF when the user wants to turn slides into PDF pages.

Best for:

- Slide handouts.
- Class presentations.
- Meeting decks.
- Sharing a non-editable deck.

How to use:

1. Open PowerPoint to PDF.
2. Add one PPTX file.
3. Choose Local-only or High fidelity.
4. Confirm service processing if using High fidelity.
5. Run the tool.
6. Download the PDF.

Important notes:

- Slides become PDF pages.
- Animations and transitions are not preserved as interactive effects.
- Local-only may simplify complex slide visuals.

Troubleshooting:

- Use High fidelity for precise slide rendering.
- Use Local-only for maximum privacy.

Related tools: PDF to PowerPoint, Compress PDF.

### Excel to PDF

Tool ID: `excelToPdf`  
Route: `/tool/excelToPdf`  
Input: One XLSX file  
Output: `{original}-converted.pdf`

Use Excel to PDF when the user wants to render spreadsheet sheets as PDF pages.

Best for:

- Invoices.
- Tables.
- Financial sheets.
- Reports.

How to use:

1. Open Excel to PDF.
2. Add one XLSX file.
3. Wait for sheet names to load.
4. Select sheets.
5. Choose portrait or landscape orientation.
6. Choose Fit Content or A4 Size.
7. Choose conversion mode.
8. Run the tool.
9. Download the PDF.

Options:

- Selected sheets.
- Portrait orientation.
- Landscape orientation.
- Fit Content.
- A4 Size.
- Local-only or High fidelity conversion.

Important notes:

- Local-only may simplify charts, merged cells, formulas, and exact pagination.
- High fidelity requires a configured conversion service.

Troubleshooting:

- Use landscape for wide tables.
- Wait for sheet names to load before converting.
- Use High fidelity for complex spreadsheets when available.

Related tools: PDF to Excel, Compress PDF.

### HTML to PDF

Tool ID: `htmlToPdf`  
Route: `/tool/htmlToPdf`  
Input: One HTML or HTM file  
Output: `{original}-converted.pdf`

Use HTML to PDF when the user wants to render an HTML file into PDF.

Best for:

- Static web pages.
- Exported HTML.
- Templates.
- Receipts or reports saved as HTML.

How to use:

1. Open HTML to PDF.
2. Add one HTML or HTM file.
3. Choose Local-only or High fidelity.
4. Confirm service processing if using High fidelity.
5. Run the tool.
6. Download the PDF.

Important notes:

- Self-contained HTML works best.
- External images, scripts, CSS, and fonts may not load if unavailable.
- High fidelity can use Chromium through the configured conversion service.

Troubleshooting:

- Use a self-contained HTML file.
- Inline CSS and assets when possible.
- Use High fidelity for browser-accurate rendering if the service is configured.

Related tools: Word to PDF, Compress PDF.

### PDF to JPG

Tool ID: `pdfToJpg`  
Route: `/tool/pdfToJpg`  
Input: One PDF  
Output: `{original}-jpg.zip`

Use PDF to JPG when the user wants every PDF page exported as an image.

Best for:

- Sharing pages as images.
- Creating thumbnails.
- Extracting visual pages.
- Uploading pages to systems that accept images only.

How to use:

1. Open PDF to JPG.
2. Add one PDF.
3. Choose conversion mode.
4. Run the tool.
5. Download the ZIP archive of JPG files.

Important notes:

- Text becomes pixels and is no longer editable.
- Large PDFs or high-DPI rendering can use significant memory.
- Local rendering uses browser PDF.js.
- Service mode can use PDFium when configured.

Troubleshooting:

- Use Local-only for private browser rendering.
- Use service mode for very large or high-DPI jobs when configured.
- Use OCR if the user wants text, not images.

Related tools: JPG to PDF, OCR PDF, Compress PDF.

### PDF to Word

Tool ID: `pdfToWord`  
Route: `/tool/pdfToWord`  
Input: One PDF  
Output: `{original}-converted.docx`

Use PDF to Word when the user wants editable text in a DOCX file.

Best for:

- Text-based PDFs.
- Reports.
- Resumes.
- Starting an editable Word version.

How to use:

1. Open PDF to Word.
2. Add one PDF.
3. Choose Local-only, Editable, or High fidelity where available.
4. Confirm service processing for service-backed modes.
5. Run the tool.
6. Download the DOCX.

Important notes:

- Scanned PDFs need OCR first.
- Local-only infers text from PDF coordinates and may simplify layout.
- Editable mode requires the configured conversion service.

Troubleshooting:

- If the PDF is scanned, run OCR first.
- If layout is messy, use Editable or High fidelity with a configured service.
- Verify headings, tables, columns, and page breaks after conversion.

Related tools: Word to PDF, OCR PDF, PDF to Excel.

### PDF to PowerPoint

Tool ID: `pdfToPowerPoint`  
Route: `/tool/pdfToPowerPoint`  
Input: One PDF  
Output: `{original}-converted.pptx`

Use PDF to PowerPoint when the user wants PDF pages as PowerPoint slides.

Best for:

- Turning slide PDFs back into presentations.
- Creating editable decks from PDF pages.
- Visual slide recovery.

How to use:

1. Open PDF to PowerPoint.
2. Add one PDF.
3. Choose slide layout: Widescreen 16:9 or Standard 4:3.
4. Choose conversion mode.
5. Confirm service processing if using a service-backed mode.
6. Run the tool.
7. Download the PPTX.

Important notes:

- Local-only export is best effort.
- Service-backed mode is recommended for better visual or editable fidelity.
- Complex graphics may need manual cleanup.

Troubleshooting:

- Choose the aspect ratio that matches the source PDF.
- Use service-backed mode for complex layouts when configured.

Related tools: PowerPoint to PDF, PDF to JPG.

### PDF to Excel

Tool ID: `pdfToExcel`  
Route: `/tool/pdfToExcel`  
Input: One PDF  
Output: `{original}-converted.xlsx`

Use PDF to Excel when the user wants table-like data extracted into a spreadsheet.

Best for:

- Invoices.
- Reports with tables.
- Text-based tabular PDFs.
- Data extraction.

How to use:

1. Open PDF to Excel.
2. Add one PDF.
3. Choose Local-only, Editable, or High fidelity where available.
4. Confirm service processing for service-backed modes.
5. Run the tool.
6. Download the XLSX.

Important notes:

- Local table extraction is inferred from text coordinates.
- Scanned documents need OCR or service-backed understanding.
- Merged cells, multi-page tables, and unusual layouts may need cleanup.

Troubleshooting:

- Use OCR first for scanned tables.
- Verify totals, merged cells, and multi-page rows.
- Use Editable mode with a configured service for better structure.

Related tools: Excel to PDF, OCR PDF, PDF to Word.

### PDF to PDF/A

Tool ID: `pdfToPdfA`  
Route: `/tool/pdfToPdfA`  
Input: One PDF  
Output: `{original}-pdfa.pdf`

Use PDF to PDF/A when the user wants an archive-oriented PDF.

Best for:

- Long-term records.
- Archival workflows.
- Systems that prefer standardized PDF output.

How to use:

1. Open PDF to PDF/A.
2. Add one PDF.
3. Run the tool.
4. Download the archive-oriented PDF.

Important notes:

- Formal PDF/A compliance should be verified with a dedicated validator.
- Some source files contain features that cannot be fully normalized locally.
- The chatbot must not guarantee regulatory compliance.

Troubleshooting:

- Run the output through a PDF/A validator when compliance matters.
- Use Repair PDF first if conversion fails.

Related tools: Repair PDF, Compress PDF.

## 12. Common User Questions

### Is IHatePDF safe to use?

Yes for local workflows: standard tools process files in the browser without uploading them. For conversion tools, choose Local-only for maximum privacy. High-fidelity and editable modes may use a configured self-hosted conversion service.

### Do I need an account?

No. IHatePDF is designed for direct use without sign-up.

### Is IHatePDF free?

IHatePDF is positioned as a free utility with optional donation support.

### Are my files uploaded?

For standard local tools, no upload is needed. Files are processed in the browser. For service-backed conversion modes, the selected file may be sent to the configured conversion service after confirmation.

### Can IHatePDF work offline?

Many local tools can work offline after the app and required assets are cached. Service-backed conversion modes require network access.

### What is the file size limit?

There is no cloud upload limit for local tools, but browser memory is the practical limit. Very large files can fail, slow down, or crash the browser tab.

### Why is my PDF to Word output messy?

PDFs often store visual layout rather than clean document structure. Local conversion infers text positions and may simplify layout. Use Editable or High fidelity mode with a configured service for better results, or manually clean up the DOCX.

### Why does OCR not detect text correctly?

OCR accuracy depends on scan quality, language selection, page rotation, resolution, and layout. Rotate pages first, choose the correct language, and use clearer scans when possible.

### Can IHatePDF edit existing PDF text?

IHatePDF can add annotations, page numbers, watermarks, crop pages, and fill forms. It is not a full native text editor for every PDF. To change existing text, try PDF to Word, edit the DOCX, then convert Word to PDF.

### Can I securely redact with a black rectangle?

No. Drawing a rectangle, cropping, or adding an overlay should not be treated as secure legal redaction. For true redaction, use a dedicated redaction tool and verify the result.

### Can IHatePDF recover any broken PDF?

No. Repair PDF is best effort. It may fix some structural issues, but it cannot recover missing bytes, severe corruption, unsupported encryption, or incomplete files.

### Can I unlock a PDF without a password?

No. IHatePDF requires the correct password and should only be used for files the user has permission to access.

## 13. Troubleshooting Guide

### The execute button is disabled

Likely causes:

- No file has been added.
- The wrong file type was added.
- A conversion mode is required.
- A current job is still processing.

Fix:

1. Add the required file or files.
2. Check the tool's accepted file type.
3. For conversion tools, choose a conversion mode.
4. Wait for current processing to finish.

### Unsupported file type

Accepted files by tool:

- PDF tools: PDF.
- JPG to PDF: JPG, JPEG, PNG.
- Word to PDF: DOCX.
- PowerPoint to PDF: PPTX.
- Excel to PDF: XLSX.
- HTML to PDF: HTML or HTM.

Fix:

- Choose the tool that matches the input file.
- Convert unsupported formats elsewhere first.
- Rename only if the actual file format is correct; changing an extension does not convert a file.

### High-fidelity conversion fails

Likely cause:

- The conversion service URL is not configured.

Fix:

- Choose Local-only mode.
- Configure and run the self-hosted conversion service if high fidelity is required.

### Browser tab crashes or freezes

Likely causes:

- File is too large.
- Too many files are being processed at once.
- Device has limited memory.
- Mobile browser is throttling heavy work.

Fix:

1. Try a desktop browser.
2. Close other tabs.
3. Process fewer files at a time.
4. Split or compress files first.
5. Keep the tab active while processing.

### Output file is larger than expected

Likely causes:

- Images were converted into PDF pages.
- Watermark image increased file size.
- PDF was already optimized.
- Conversion added embedded resources.

Fix:

- Run Compress PDF after creating the output.
- Use a smaller watermark image.
- Use lower image resolution before JPG to PDF.

### Password-protected PDF fails in another tool

Likely cause:

- The PDF is encrypted or access-restricted.

Fix:

1. Use Unlock PDF with the correct password.
2. Download the unlocked output.
3. Use the unlocked output in the intended tool.

### Scanned PDF does not convert to editable text

Likely cause:

- The PDF contains images of text, not selectable text.

Fix:

1. Run OCR PDF.
2. Choose the correct language.
3. Use the OCR text or try service-backed editable conversion if available.

### PDF/A compliance is required

Likely issue:

- IHatePDF can create archive-oriented output, but formal compliance requires validation.

Fix:

- Convert with PDF to PDF/A.
- Run the result through a dedicated PDF/A validator.
- Do not rely on the chatbot for legal or regulatory certification.

## 14. Recommended Tool Selection Logic

Use these rules to recommend tools:

- User wants one PDF from many PDFs: Merge PDF.
- User wants selected pages: Split PDF.
- User wants smaller file size: Compress PDF.
- User has sideways pages: Rotate PDF.
- User wants to reorder pages: Organize PDF.
- User has scanned pages and needs text: OCR PDF.
- User wants to add a password: Protect PDF.
- User knows the password and wants restrictions removed: Unlock PDF.
- User has a broken PDF: Repair PDF.
- User wants page numbers: Add Page Numbers.
- User wants "CONFIDENTIAL" or a logo on pages: Add Watermark.
- User wants to remove margins: Crop PDF.
- User wants to add visible text or marks: Edit PDF.
- User wants to fill interactive fields: PDF Forms.
- User has images and wants a PDF: JPG to PDF.
- User has DOCX and wants PDF: Word to PDF.
- User has PPTX and wants PDF: PowerPoint to PDF.
- User has XLSX and wants PDF: Excel to PDF.
- User has HTML and wants PDF: HTML to PDF.
- User wants image exports of pages: PDF to JPG.
- User wants editable DOCX: PDF to Word.
- User wants editable slides: PDF to PowerPoint.
- User wants spreadsheet data: PDF to Excel.
- User wants archival format: PDF to PDF/A.

## 15. Suggested Chatbot Responses

### Privacy response

IHatePDF is designed for local-first processing. For standard PDF tools, your file is processed in your browser and does not need to be uploaded. For conversion tools, choose Local-only for maximum privacy. High-fidelity and Editable modes may use a configured self-hosted conversion service.

### Tool recommendation response

For that task, use **{tool name}**. Open `{route}`, add your file, set the options in the sidebar, run the tool, and download the result. If your file is password-protected, unlock it first.

### Large file response

IHatePDF does not have a normal cloud upload limit for local tools, but your browser memory is the real limit. If the file is very large, try a desktop browser, close other tabs, process fewer files at once, or split the PDF before running the heavier task.

### Service conversion response

High-fidelity conversion needs a configured IHatePDF conversion service. If you see a service configuration error, choose Local-only mode instead, or configure the self-hosted conversion service before trying High fidelity again.

### Scanned PDF response

If the PDF is scanned, it may not contain real selectable text. Use OCR PDF first, choose the correct language, and then use the extracted text or try an editable conversion workflow.

## 16. Glossary

- **Local-first:** Processing happens on the user's device before any server path is considered.
- **Web Worker:** A browser background thread used for heavy processing without freezing the UI.
- **WASM:** WebAssembly, a browser technology for high-performance code.
- **PDF.js:** A PDF rendering library used for previews and page rendering.
- **pdf-lib:** A JavaScript library used for manipulating PDF files in the browser.
- **Tesseract:** OCR engine used to recognize text from scanned pages.
- **OCR:** Optical Character Recognition, converting image text into machine-readable text.
- **PDF/A:** A PDF standard intended for long-term archiving.
- **Flatten form fields:** Convert interactive form values into fixed page content.
- **Conversion service:** Optional self-hosted backend for higher-fidelity or editable conversion.
- **Local-only mode:** Conversion mode that keeps processing in the browser.
- **High fidelity mode:** Service-backed mode focused on layout accuracy.
- **Editable mode:** Service-backed mode focused on structured editable output.

## 17. Guardrails for Sensitive Topics

The chatbot should use these guardrails:

- For passwords: help users unlock only when they know the password and have permission.
- For redaction: explain that overlays, watermarks, and crop boxes are not guaranteed secure redaction.
- For legal or compliance questions: provide general product information, then recommend a qualified reviewer or validator.
- For corrupted files: explain repair is best effort.
- For privacy: distinguish local tools from service-backed conversions.
- For medical, legal, financial, or government documents: emphasize Local-only mode when possible and recommend careful verification of outputs.

## 18. Known Practical Limits

IHatePDF is powerful, but the chatbot should clearly explain these limits:

- Browser memory limits can stop very large jobs.
- Mobile browsers can throttle heavy processing.
- OCR accuracy depends on scan quality.
- PDF-to-Office conversion is inherently imperfect for complex layouts.
- Local-only Office conversion may simplify formatting.
- High-fidelity conversion requires a configured conversion service.
- Repair cannot recover missing file data.
- PDF/A output should be externally validated when compliance matters.
- Editing tools add content but do not fully rewrite every existing PDF text object.

## 19. Example User Intent Mapping

User: "I need to combine two PDFs."  
Answer: Use Merge PDF.

User: "I only need pages 4 to 9."  
Answer: Use Split PDF and enter `4-9`.

User: "My file is too large for email."  
Answer: Use Compress PDF. Try Recommended first, then Extreme if needed.

User: "The scan is sideways."  
Answer: Use Rotate PDF before OCR or sharing.

User: "I can't select text in my PDF."  
Answer: It is probably scanned. Use OCR PDF.

User: "I need a Word file from this PDF."  
Answer: Use PDF to Word. Use OCR first if scanned. Use Editable mode if configured and better structure is needed.

User: "I need to convert a resume DOCX to PDF privately."  
Answer: Use Word to PDF with Local-only mode.

User: "The converter says service URL is missing."  
Answer: Choose Local-only mode or configure the conversion service.

User: "Can I black out text with a rectangle?"  
Answer: You can visually cover text with Edit PDF, but it is not secure redaction.

User: "Can you remove a PDF password without knowing it?"  
Answer: No. Unlock PDF requires the correct password and permission to access the file.

import React, { useState } from 'react';
import { 
  Layers, 
  Split, 
  Minimize2, 
  RotateCw, 
  ScanText, 
  LayoutGrid, 
  Lock, 
  Unlock, 
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  ListOrdered,
  Stamp,
  Crop,
  PencilLine,
  FilePenLine,
  Images,
  FileText,
  Presentation,
  Table2,
  Code2,
  FileImage,
  Archive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../components/layout/Navbar';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const tools: Tool[] = [
  { id: 'merge', title: 'Merge PDF', description: 'Combine multiple PDFs into one unified document instantly.', icon: Layers },
  { id: 'split', title: 'Split PDF', description: 'Extract pages or separate one PDF into many distinct files.', icon: Split },
  { id: 'compress', title: 'Compress PDF', description: 'Reduce file size while maintaining sharp text and image quality.', icon: Minimize2 },
  { id: 'rotate', title: 'Rotate PDF', description: 'Quickly rotate individual pages or the entire document.', icon: RotateCw },
  { id: 'ocr', title: 'OCR PDF', description: 'Extract text from scanned documents using local, secure AI.', icon: ScanText },
  { id: 'organize', title: 'Organize PDF', description: 'Sort, duplicate, and delete PDF pages with an interactive canvas.', icon: LayoutGrid },
  { id: 'protect', title: 'Protect PDF', description: 'Add a secure password and encrypt your PDF file locally.', icon: Lock },
  { id: 'unlock', title: 'Unlock PDF', description: 'Remove password security from your PDF for easy access.', icon: Unlock },
  { id: 'repair', title: 'Repair PDF', description: 'Rebuild damaged PDF structure and recover readable documents locally.', icon: Wrench },
  { id: 'addPageNumbers', title: 'Add Page Numbers', description: 'Overlay customizable page numbers onto each page of your PDF document.', icon: ListOrdered },
  { id: 'addWatermark', title: 'Add Watermark', description: 'Stamp semi-transparent rotated text across every PDF page locally.', icon: Stamp },
  { id: 'crop', title: 'Crop PDF', description: 'Clip PDF pages to exact local point bounds without uploading files.', icon: Crop },
  { id: 'edit', title: 'Edit PDF', description: 'Burn text, rectangles, and freehand vector annotations into PDF pages.', icon: PencilLine },
  { id: 'forms', title: 'PDF Forms', description: 'Fill and flatten interactive PDF form fields directly in the browser.', icon: FilePenLine },
  { id: 'jpgToPdf', title: 'JPG to PDF', description: 'Convert JPG and PNG images into ordered PDF pages locally.', icon: Images },
  { id: 'wordToPdf', title: 'Word to PDF', description: 'Convert DOCX documents into paginated PDFs without uploading files.', icon: FileText },
  { id: 'powerPointToPdf', title: 'PowerPoint to PDF', description: 'Convert PPTX slides into landscape PDF pages locally.', icon: Presentation },
  { id: 'excelToPdf', title: 'Excel to PDF', description: 'Render XLSX worksheets into paginated PDF tables locally.', icon: Table2 },
  { id: 'htmlToPdf', title: 'HTML to PDF', description: 'Render HTML files into clean paginated PDFs locally.', icon: Code2 },
  { id: 'pdfToJpg', title: 'PDF to JPG', description: 'Export every PDF page as a zipped JPG image set locally.', icon: FileImage },
  { id: 'pdfToWord', title: 'PDF to Word', description: 'Extract editable PDF text into a DOCX document locally.', icon: FileText },
  { id: 'pdfToPowerPoint', title: 'PDF to PowerPoint', description: 'Convert PDF pages into editable PowerPoint slides locally.', icon: Presentation },
  { id: 'pdfToExcel', title: 'PDF to Excel', description: 'Extract tables from PDF into structured Excel sheets locally.', icon: Table2 },
  { id: 'pdfToPdfA', title: 'PDF to PDF/A', description: 'Convert PDF files into ISO-standardized PDF/A for long-term archiving.', icon: Archive },
];

export const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-16 py-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center pt-10 pb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <h1 className="text-5xl md:text-7xl font-outfit font-black tracking-tight mb-6 text-text-primary">
          Process PDFs <br />
          <span className="text-brand-primary">Without the Cloud.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          Lightning fast, zero-server document tools. Every file stays on your device. 
          Your privacy is absolute.
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">100% Private</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Local Processing</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
            <Lock className="w-5 h-5 text-brand-primary" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">No Uploads</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-xl relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/40 to-brand-primary/0 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative flex items-center w-full bg-bg-card/60 backdrop-blur-xl border border-border-glass rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20">
            <Search className="w-6 h-6 text-text-secondary ml-6" />
            <input 
              type="text"
              placeholder="Search for a tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-5 px-4 text-lg text-text-primary placeholder:text-text-secondary/60"
            />
          </div>
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="w-full">
        {filteredTools.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            <p className="text-xl">No tools found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filteredTools.map((tool, index) => (
              <Link 
                key={tool.id}
                to={`/tool/${tool.id}`}
                className={cn(
                  "block break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden",
                  "border border-border-glass bg-bg-dark/40 backdrop-blur-md shadow-lg",
                  "transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:bg-bg-card/80",
                  // Varying padding to create a slightly staggered masonry effect
                  index % 3 === 0 ? "p-8" : index % 2 === 0 ? "p-10" : "p-6"
                )}
              >
                {/* Animated Gradient Border on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-transparent opacity-50" />
                </div>
                
                <div className="relative z-10 flex flex-col items-start gap-4">
                  <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary shadow-[0_0_15px_hsla(354,76%,49%,0.15)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <tool.icon className="w-7 h-7" strokeWidth={2} />
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-outfit font-bold text-text-primary mb-2 group-hover:text-brand-primary transition-colors duration-300">
                      {tool.title}
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center text-sm font-semibold text-brand-primary/0 group-hover:text-brand-primary transition-colors duration-300">
                    <span className="-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
                      Open Tool <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Why IHatePDF Section (SEO/GEO Focus) */}
      <section className="w-full max-w-5xl mx-auto py-20 border-t border-border-glass">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-outfit font-black mb-6 text-text-primary">
            The Ultimate <span className="text-brand-primary">iLovePDF Alternative</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            Why settle for cloud-based tools that store your data? IHatePDF brings professional-grade PDF processing to your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "100% Private",
              desc: "Files never leave your device. We use WASM technology to process everything locally. No server-side storage, no data leaks.",
              icon: ShieldCheck
            },
            {
              title: "Lightning Fast",
              desc: "No upload or download queues. Local processing is up to 10x faster than cloud-based alternatives for large files.",
              icon: Zap
            },
            {
              title: "Zero Cost",
              desc: "All professional tools are available for free. No subscriptions, no hidden limits, just pure productivity.",
              icon: ArrowRight
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-2xl bg-bg-dark/20 border border-border-glass hover:border-brand-primary/30 transition-all">
              <feature.icon className="w-10 h-10 text-brand-primary mb-6" />
              <h3 className="text-xl font-bold mb-4 text-text-primary">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section (GEO Focus) */}
      <section className="w-full max-w-4xl mx-auto pb-32">
        <h2 className="text-2xl md:text-4xl font-outfit font-black mb-12 text-center text-text-primary">
          Frequently Asked <span className="text-brand-primary">Questions</span>
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "Is IHatePDF really safe to use?",
              a: "Yes. Unlike iLovePDF or SmallPDF, IHatePDF works entirely offline using your browser's local resources. Your files are never uploaded to any server, making it the most secure PDF workspace available."
            },
            {
              q: "How can you process PDFs without a server?",
              a: "We utilize advanced WebAssembly (WASM) and JavaScript libraries (like pdf-lib and PDF.js) that run directly in your browser. This allows us to perform complex operations like merging, splitting, and OCR locally."
            },
            {
              q: "Is there a limit on file size?",
              a: "The only limit is your device's memory. Since there's no upload step, you can process large documents much faster than you could on cloud platforms."
            },
            {
              q: "Do I need an internet connection?",
              a: "Only to load the initial page. Once loaded, IHatePDF can function entirely offline as a Progressive Web App (PWA)."
            }
          ].map((faq, i) => (
            <div key={i} className="p-6 rounded-xl bg-bg-dark/40 border border-border-glass">
              <h3 className="text-lg font-bold mb-3 text-text-primary">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useFileStore } from '../store/useFileStore';
import { ToolType } from '../types';
import { PageOrganizer } from '../components/workspace/PageOrganizer';
import { ConfigSidebar } from '../components/workspace/ConfigSidebar';
import { ProcessingVisualizer } from '../components/workspace/ProcessingVisualizer';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceSkeleton } from '../components/ui/Skeletons';
import { cn } from '../utils/cn';

const getToolColor = (tool: ToolType | null): string => {
  switch (tool) {
    case 'pdfToWord':
    case 'wordToPdf':
    case 'htmlToPdf':
      return 'text-blue-500';
    case 'pdfToExcel':
    case 'excelToPdf':
      return 'text-emerald-500';
    case 'pdfToPowerPoint':
    case 'powerPointToPdf':
      return 'text-orange-500';
    case 'protect':
    case 'unlock':
    case 'forms':
      return 'text-amber-500';
    case 'ocr':
    case 'pdfToJpg':
    case 'jpgToPdf':
      return 'text-cyan-500';
    default:
      return 'text-brand-primary';
  }
};

const getToolColorBg = (tool: ToolType | null): string => {
  switch (tool) {
    case 'pdfToWord':
    case 'wordToPdf':
    case 'htmlToPdf':
      return 'bg-blue-500';
    case 'pdfToExcel':
    case 'excelToPdf':
      return 'bg-emerald-500';
    case 'pdfToPowerPoint':
    case 'powerPointToPdf':
      return 'bg-orange-500';
    case 'protect':
    case 'unlock':
    case 'forms':
      return 'bg-amber-500';
    case 'ocr':
    case 'pdfToJpg':
    case 'jpgToPdf':
      return 'bg-cyan-500';
    default:
      return 'bg-brand-primary';
  }
};

export const ToolWorkspace: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const setActiveTool = useFileStore((state) => state.setActiveTool);
  const activeTool = useFileStore((state) => state.activeTool);
  const status = useFileStore((state) => state.status);
  const errorMessage = useFileStore((state) => state.errorMessage);
  const isProcessing = status === 'reading' || status === 'processing';

  const validTools: ToolType[] = ['merge', 'split', 'compress', 'rotate', 'ocr', 'organize', 'protect', 'unlock', 'repair', 'addPageNumbers', 'addWatermark', 'crop', 'edit', 'forms', 'jpgToPdf', 'wordToPdf', 'powerPointToPdf', 'excelToPdf', 'htmlToPdf', 'pdfToJpg', 'pdfToWord', 'pdfToPowerPoint', 'pdfToExcel', 'pdfToPdfA'];

  useEffect(() => {
    if (toolId && validTools.includes(toolId as ToolType)) {
      setActiveTool(toolId as ToolType);
      
      // Update dynamic title and meta for SEO
      const toolLabel = toolId
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      document.title = `${toolLabel} - IHatePDF`;

      // Dynamic Meta Description & Canonical
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `Use our free, private ${toolLabel} tool to process your documents 100% locally. No uploads, zero logs, absolute security.`);
      }

      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', `https://ihatepdf.io/tool/${toolId}`);
      }
    }

    return () => {
      document.title = 'IHatePDF - 100% Private iLovePDF Alternative';
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'Merge, split, compress, and convert PDFs locally with IHatePDF. The most secure iLovePDF alternative.');
      }
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', 'https://ihatepdf.io/');
      }
    };
  }, [toolId, setActiveTool]);

  if (status === 'reading') {
    return <WorkspaceSkeleton />;
  }

  if (!toolId || !validTools.includes(toolId as ToolType)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full flex flex-col gap-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="p-2 rounded-full hover:bg-border-glass transition-colors text-text-secondary hover:text-text-primary"
          title="Back to Tools"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-outfit font-black text-text-primary uppercase tracking-tight">
          {activeTool} <span className={getToolColor(activeTool)}>Workspace</span>
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full min-h-[60vh] rounded-3xl border border-border-glass bg-bg-dark/20 backdrop-blur-sm p-6 overflow-hidden">
          {(status === 'failed' || status === 'warning') && errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-sm font-semibold leading-6 text-text-primary">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
              <span>{errorMessage}</span>
            </div>
          )}
          {isProcessing ? <ProcessingVisualizer /> : <PageOrganizer />}
        </div>
        
        {!isProcessing && <ConfigSidebar />}
      </div>

      {/* Dynamic SEO/GEO Content */}
      {!isProcessing && activeTool && (
        <section className="mt-12 py-12 border-t border-border-glass max-w-4xl">
          <h2 className="text-2xl font-outfit font-black text-text-primary mb-6 uppercase tracking-tight">
            About {activeTool} <span className={getToolColor(activeTool)}>Processing</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary">How it works</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Our {activeTool} tool uses high-performance WebAssembly (WASM) to process your PDF files entirely in your browser. Unlike traditional cloud tools like iLovePDF, your data never leaves your device. This ensures 100% privacy and significantly faster processing for large files.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary">Privacy & Security</h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-center gap-2">
                  <div className={cn("w-1 h-1 rounded-full", getToolColorBg(activeTool))} />
                  No server-side uploads or storage
                </li>
                <li className="flex items-center gap-2">
                  <div className={cn("w-1 h-1 rounded-full", getToolColorBg(activeTool))} />
                  Zero logs or activity tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className={cn("w-1 h-1 rounded-full", getToolColorBg(activeTool))} />
                  Secure local-first architecture
                </li>
              </ul>
            </div>
          </div>
          <p className="text-[10px] text-text-secondary/40 uppercase font-black tracking-[0.2em] mt-12">
            Technical Specification: Local WASM Runtime • Security Audited: May 2026
          </p>
        </section>
      )}
    </div>
  );
};

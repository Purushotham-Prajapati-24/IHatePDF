import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useFileStore } from '../store/useFileStore';
import { ToolType } from '../types';
import { PageOrganizer } from '../components/workspace/PageOrganizer';
import { ConfigSidebar } from '../components/workspace/ConfigSidebar';
import { ProcessingVisualizer } from '../components/workspace/ProcessingVisualizer';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    }
  }, [toolId, setActiveTool]);

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
          {activeTool} <span className="text-brand-primary">Workspace</span>
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
    </div>
  );
};

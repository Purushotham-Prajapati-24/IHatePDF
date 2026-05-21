import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../store/useFileStore';
import { FileMetadata } from '../../types';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { cn } from '../layout/Navbar';

export const DropZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const addFiles = useFileStore((state) => state.addFiles);
  const activeTool = useFileStore((state) => state.activeTool);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set dragging to false if we are actually leaving the window
      if (!e.relatedTarget || (e.relatedTarget as HTMLElement).nodeName === 'HTML') {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!e.dataTransfer?.files) return;

      const files = Array.from(e.dataTransfer.files);
      const validFiles: FileMetadata[] = [];
      let rejectedCount = 0;

      files.forEach((file) => {
        if (isAcceptedFile(file, activeTool)) {
          validFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type || getFallbackMimeType(file),
            blob: file,
            rotation: 0
          });
        } else {
          rejectedCount++;
        }
      });

      if (rejectedCount > 0) {
        toast.error(`Rejected ${rejectedCount} file(s). ${getAcceptedFileMessage(activeTool)}`);
      }

      if (validFiles.length > 0) {
        addFiles(validFiles);
        toast.success(`Added ${validFiles.length} file(s) to workspace.`);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [activeTool, addFiles]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-dark/60 backdrop-blur-md flex items-center justify-center pointer-events-none transition-all duration-300">
      <div className="absolute inset-8 rounded-3xl border-4 border-dashed border-brand-primary bg-brand-primary/5 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center mb-6 shadow-[0_0_40px_hsla(354,76%,49%,0.4)] animate-bounce">
          <UploadCloud className="w-12 h-12 text-brand-primary" />
        </div>
        <h2 className="text-4xl font-outfit font-black text-text-primary tracking-tight mb-2">
          Drop Files Here
        </h2>
        <p className="text-xl text-brand-primary/80 font-semibold">
          Your files never leave your device
        </p>
      </div>
    </div>
  );
};

function isAcceptedFile(file: File, activeTool: string | null): boolean {
  const name = file.name.toLowerCase();

  if (activeTool === 'jpgToPdf') {
    return file.type === 'image/png' || file.type === 'image/jpeg' || /\.(png|jpe?g)$/i.test(name);
  }

  if (activeTool === 'wordToPdf') {
    return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || name.endsWith('.docx');
  }

  if (activeTool === 'powerPointToPdf') {
    return file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      || name.endsWith('.pptx');
  }

  if (activeTool === 'excelToPdf') {
    return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || name.endsWith('.xlsx');
  }

  if (activeTool === 'htmlToPdf') {
    return file.type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm');
  }

  return file.type === 'application/pdf' || name.endsWith('.pdf');
}

function getAcceptedFileMessage(activeTool: string | null): string {
  if (activeTool === 'jpgToPdf') return 'Only JPG, JPEG, and PNG files are supported.';
  if (activeTool === 'wordToPdf') return 'Only DOCX files are supported.';
  if (activeTool === 'powerPointToPdf') return 'Only PPTX files are supported.';
  if (activeTool === 'excelToPdf') return 'Only XLSX files are supported.';
  if (activeTool === 'htmlToPdf') return 'Only HTML files are supported.';
  return 'Only PDF files are supported.';
}

function getFallbackMimeType(file: File): string {
  const name = file.name.toLowerCase();

  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'text/html';
  return 'application/pdf';
}

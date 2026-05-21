import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../store/useFileStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { RotateCw, Trash2, Loader2 } from 'lucide-react';

export const PageOrganizer: React.FC = () => {
  const files = useFileStore((state) => state.files);
  const activeTool = useFileStore((state) => state.activeTool);
  const selectedPages = useFileStore((state) => state.selectedPages);
  const updateFilePreviews = useFileStore((state) => state.updateFilePreviews);
  const initSelectedPages = useFileStore((state) => state.initSelectedPages);
  const setPageOrder = useFileStore((state) => state.setPageOrder);
  const rotatePage = useFileStore((state) => state.rotatePage);
  const deletePage = useFileStore((state) => state.deletePage);
  const removeFile = useFileStore((state) => state.removeFile);
  const reorderFiles = useFileStore((state) => state.reorderFiles);

  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeTool === 'jpgToPdf' || activeTool === 'wordToPdf' || activeTool === 'powerPointToPdf' || activeTool === 'excelToPdf' || activeTool === 'htmlToPdf') return;

    const generateMissingPreviews = async () => {
      let needsInit = false;
      setIsGenerating(true);
      try {
        for (const file of files) {
          if (!file.previewUrls || file.previewUrls.length === 0) {
            const { generatePagePreviewMetadata } = await import('../../services/previewService');
            const previews = await generatePagePreviewMetadata(file.blob);
            updateFilePreviews(
              file.id,
              previews.map((preview) => preview.url),
              previews.map(({ width, height }) => ({ width, height })),
            );
            needsInit = true;
          }
        }
        if (needsInit || (files.length > 0 && selectedPages.length === 0)) {
          initSelectedPages();
        }
      } catch (error) {
        console.error('Failed to generate previews:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (files.length > 0) {
      generateMissingPreviews();
    }
  }, [activeTool, files, updateFilePreviews, initSelectedPages, selectedPages.length]);

  useEffect(() => {
    if (activeTool !== 'jpgToPdf') return;

    const urls = Object.fromEntries(files.map((file) => [file.id, URL.createObjectURL(file.blob)]));
    setImageUrls(urls);

    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [activeTool, files]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (activeTool === 'jpgToPdf') {
      reorderFiles(result.source.index, result.destination.index);
      return;
    }
    
    const items = Array.from(selectedPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPageOrder(items);
  };

  if (files.length === 0) return null;

  if (activeTool === 'jpgToPdf') {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-wrap gap-4 justify-center md:justify-start">
                {files.map((file, index) => (
                  <Draggable key={file.id} draggableId={file.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`relative group w-32 md:w-40 rounded-xl overflow-hidden border-2 bg-bg-card transition-all duration-200 shadow-sm ${
                          snapshot.isDragging ? 'border-brand-primary shadow-xl z-50 scale-105' : 'border-border-glass hover:border-brand-primary/50'
                        }`}
                      >
                        <div className="aspect-[1/1.4] overflow-hidden bg-white flex items-center justify-center">
                          <img src={imageUrls[file.id] ?? ''} alt={file.name} className="w-full h-full object-contain" draggable={false} />
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-bg-dark/80 text-text-primary opacity-0 group-hover:opacity-100 hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-bg-dark/80 backdrop-blur-sm text-xs font-bold text-text-primary">
                          {index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }

  if (activeTool === 'wordToPdf') {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {files.map((file) => (
            <div key={file.id} className="relative group w-48 rounded-xl overflow-hidden border-2 border-border-glass bg-bg-card transition-all duration-200 shadow-sm hover:border-brand-primary/50">
              <div className="aspect-[1/1.35] bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="text-4xl font-black text-brand-primary">DOCX</div>
                <div className="mt-3 text-xs font-bold text-bg-dark break-words">{file.name}</div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="absolute bottom-2 right-2 p-1.5 rounded-md bg-bg-dark/80 text-text-primary opacity-0 group-hover:opacity-100 hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors"
                title="Remove Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'powerPointToPdf') {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {files.map((file) => (
            <div key={file.id} className="relative group w-56 rounded-xl overflow-hidden border-2 border-border-glass bg-bg-card transition-all duration-200 shadow-sm hover:border-brand-primary/50">
              <div className="aspect-video bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="text-4xl font-black text-brand-primary">PPTX</div>
                <div className="mt-3 text-xs font-bold text-bg-dark break-words">{file.name}</div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="absolute bottom-2 right-2 p-1.5 rounded-md bg-bg-dark/80 text-text-primary opacity-0 group-hover:opacity-100 hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors"
                title="Remove Presentation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'excelToPdf') {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {files.map((file) => (
            <div key={file.id} className="relative group w-48 rounded-xl overflow-hidden border-2 border-border-glass bg-bg-card transition-all duration-200 shadow-sm hover:border-brand-primary/50">
              <div className="aspect-[1/1.2] bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="text-4xl font-black text-brand-primary">XLSX</div>
                <div className="mt-3 text-xs font-bold text-bg-dark break-words">{file.name}</div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="absolute bottom-2 right-2 p-1.5 rounded-md bg-bg-dark/80 text-text-primary opacity-0 group-hover:opacity-100 hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors"
                title="Remove Workbook"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'htmlToPdf') {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {files.map((file) => (
            <div key={file.id} className="relative group w-48 rounded-xl overflow-hidden border-2 border-border-glass bg-bg-card transition-all duration-200 shadow-sm hover:border-brand-primary/50">
              <div className="aspect-[1/1.2] bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="text-4xl font-black text-brand-primary">HTML</div>
                <div className="mt-3 text-xs font-bold text-bg-dark break-words">{file.name}</div>
              </div>
              <button onClick={() => removeFile(file.id)} className="absolute bottom-2 right-2 p-1.5 rounded-md bg-bg-dark/80 text-text-primary opacity-0 group-hover:opacity-100 hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors" title="Remove HTML">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isGenerating && selectedPages.length === 0) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-brand-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-semibold">Generating page previews...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="pages" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-wrap gap-4 justify-center md:justify-start"
            >
              {selectedPages.map((page, index) => {
                const file = files.find(f => f.id === page.fileId);
                const previewUrl = file?.previewUrls?.[page.pageIndex];
                const pageId = `${page.fileId}-${page.pageIndex}`;

                if (!previewUrl) return null;

                return (
                  <Draggable key={pageId} draggableId={pageId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`relative group w-32 md:w-40 rounded-xl overflow-hidden border-2 bg-bg-card transition-all duration-200 shadow-sm ${
                          snapshot.isDragging ? 'border-brand-primary shadow-xl z-50 scale-105' : 'border-border-glass hover:border-brand-primary/50'
                        }`}
                      >
                        <div className="aspect-[1/1.4] overflow-hidden bg-white flex items-center justify-center">
                          <img 
                            src={previewUrl} 
                            alt={`Page ${page.pageIndex + 1}`}
                            className="w-full h-full object-contain transition-transform duration-300"
                            style={{ transform: `rotate(${page.rotation}deg)` }}
                            draggable={false}
                          />
                        </div>
                        
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => rotatePage(page.fileId, page.pageIndex)}
                            className="p-1.5 rounded-md bg-bg-dark/80 text-text-primary hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors"
                            title="Rotate 90°"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePage(page.fileId, page.pageIndex)}
                            className="p-1.5 rounded-md bg-bg-dark/80 text-text-primary hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-colors"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-bg-dark/80 backdrop-blur-sm text-xs font-bold text-text-primary">
                          {index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

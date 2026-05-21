import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, RefreshCw, Search, Trash2, Zap } from 'lucide-react';
import { initDB, type FileBufferRecord } from '../db/localDb';
import { useFileStore } from '../store/useFileStore';
import { filterFileBufferRecords, sortFileBufferRecords } from '../services/fileBufferHistory';
import { formatBytes } from '../services/historyMetrics';
import { downloadBlob } from '../utils/downloadBlob';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const setFiles = useFileStore((state) => state.setFiles);
  const setActiveTool = useFileStore((state) => state.setActiveTool);
  const [records, setRecords] = useState<FileBufferRecord[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredRecords = useMemo(
    () => filterFileBufferRecords(sortFileBufferRecords(records), query),
    [records, query],
  );

  async function loadFileBuffer() {
    setIsLoading(true);

    try {
      const db = await initDB();
      const cachedFiles = await db.getAll('file_buffer');
      setRecords(sortFileBufferRecords(cachedFiles));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to read local file history.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadFileBuffer();
  }, []);

  async function deleteRecord(id: string) {
    const db = await initDB();
    await db.delete('file_buffer', id);
    setRecords((currentRecords) => currentRecords.filter((record) => record.id !== id));
  }

  async function clearHistory() {
    const db = await initDB();
    await db.clear('file_buffer');
    setRecords([]);
  }

  function downloadRecord(record: FileBufferRecord) {
    downloadBlob(record.blob, record.name);
  }

  function compressRecord(record: FileBufferRecord) {
    setFiles([
      {
        id: record.id,
        name: record.name,
        size: record.size,
        type: 'application/pdf',
        blob: record.blob,
      },
    ]);
    setActiveTool('compress');
    navigate('/tool/compress');
  }

  return (
    <div className="flex w-full flex-col gap-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-[2rem] border border-border-glass bg-bg-card/35 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-2">
              <FileText className="h-4 w-4 text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
                Local file cache
              </span>
            </div>
            <h1 className="font-outfit text-4xl font-black uppercase leading-tight tracking-tight text-text-primary sm:text-5xl">
              History grid
            </h1>
            <p className="mt-4 max-w-[65ch] text-base leading-7 text-text-secondary">
              Reuse files that are still stored in your browser cache. Every action stays local and can be
              cleared immediately from IndexedDB.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadFileBuffer()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-glass bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-text-primary transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void clearHistory()}
              disabled={records.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-text-secondary"
            >
              <Trash2 className="h-4 w-4" />
              Clear History
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border-glass bg-bg-card/35 p-4 shadow-2xl backdrop-blur-2xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full max-w-xl">
            <span className="sr-only">Search cached files</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cached PDFs..."
              className="min-h-12 w-full rounded-2xl border border-border-glass bg-bg-dark/50 py-3 pl-12 pr-4 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-brand-primary/50"
            />
          </label>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">
            {filteredRecords.length} local file{filteredRecords.length === 1 ? '' : 's'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-sm font-semibold text-text-primary">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-border-glass bg-white/[0.03] p-8 text-center text-sm text-text-secondary">
            Loading local file cache...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-border-glass bg-white/[0.03] p-8 text-center text-sm leading-6 text-text-secondary">
            No cached files match this view. Add PDFs to the workspace and they will appear here while the local cache is retained.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-border-glass bg-bg-dark/35 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30"
              >
                <div className="mb-5 flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-outfit text-lg font-black tracking-tight text-text-primary">
                      {record.name}
                    </h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">
                      {formatBytes(record.size)} - {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => downloadRecord(record)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-glass bg-white/[0.04] px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-text-primary transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
                  >
                    <Download className="h-4 w-4" />
                    Re-download
                  </button>
                  <button
                    type="button"
                    onClick={() => compressRecord(record)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.02]"
                  >
                    <Zap className="h-4 w-4" />
                    Compress
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteRecord(record.id)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-glass bg-white/[0.04] px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

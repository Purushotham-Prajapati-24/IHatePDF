import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Database, FileCheck2, ShieldCheck, TrendingDown } from 'lucide-react';
import { initDB } from '../db/localDb';
import type { TaskLog } from '../types';
import {
  aggregateHistoryMetrics,
  buildActivityDays,
  formatBytes,
  formatDuration,
} from '../services/historyMetrics';

const ACTIVITY_COLORS = [
  'hsl(220, 15%, 18%)',
  'hsla(354, 76%, 49%, 0.25)',
  'hsla(354, 76%, 49%, 0.45)',
  'hsla(354, 76%, 49%, 0.68)',
  'hsl(354, 76%, 49%)',
];

export const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistoryLogs() {
      try {
        const db = await initDB();
        const historyLogs = await db.getAllFromIndex('history_logs', 'timestamp');
        const newestFirst = historyLogs.sort((a, b) => b.timestamp - a.timestamp);

        if (isMounted) {
          setLogs(newestFirst);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load local history.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistoryLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => aggregateHistoryMetrics(logs), [logs]);
  const activityDays = useMemo(() => buildActivityDays(logs), [logs]);

  const metricCards = [
    {
      label: 'Total Data Saved',
      value: formatBytes(metrics.totalDataSavedBytes),
      detail: 'Output reduction across local jobs',
      icon: TrendingDown,
    },
    {
      label: 'Local Processing Time',
      value: formatDuration(metrics.totalLocalProcessingMs),
      detail: 'Time spent inside browser workers',
      icon: Clock3,
    },
    {
      label: 'Server Bandwidth Bypassed',
      value: formatBytes(metrics.totalBandwidthBypassedBytes),
      detail: 'Data never uploaded to a server',
      icon: ShieldCheck,
    },
    {
      label: 'Total Files Processed',
      value: metrics.totalFilesProcessed.toLocaleString(),
      detail: `${logs.length.toLocaleString()} completed task${logs.length === 1 ? '' : 's'}`,
      icon: FileCheck2,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] border border-border-glass bg-bg-card/35 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-brand-primary/15 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-2">
            <Database className="h-4 w-4 text-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
              IndexedDB transparency ledger
            </span>
          </div>
          <h1 className="font-outfit text-4xl font-black uppercase leading-tight tracking-tight text-text-primary sm:text-5xl">
            Local-first privacy dashboard
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-7 text-text-secondary">
            Review the concrete value of keeping PDF work on this device: saved bytes, avoided uploads,
            worker time, and the local processing rhythm stored in your browser.
          </p>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-sm font-semibold text-text-primary">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-border-glass bg-bg-card/35 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                Live local
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">{card.label}</p>
            <p className="mt-2 font-outfit text-3xl font-black tracking-tight text-text-primary">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[2rem] border border-border-glass bg-bg-card/35 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
                Activity grid
              </p>
              <h2 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-text-primary">
                Last 12 weeks of processing
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
              Less
              {ACTIVITY_COLORS.map((color) => (
                <span key={color} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />
              ))}
              More
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <svg width="690" height="112" role="img" aria-label="Local processing activity over the last 12 weeks">
              {activityDays.map((day, index) => {
                const column = Math.floor(index / 7);
                const row = index % 7;

                return (
                  <rect
                    key={day.dateKey}
                    x={column * 56}
                    y={row * 16}
                    width="12"
                    height="12"
                    rx="3"
                    fill={ACTIVITY_COLORS[day.intensity]}
                  >
                    <title>{`${day.dateKey}: ${day.count} task${day.count === 1 ? '' : 's'}`}</title>
                  </rect>
                );
              })}
            </svg>
          </div>
        </article>

        <article className="rounded-[2rem] border border-border-glass bg-bg-card/35 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                Recent history
              </p>
              <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-text-primary">
                Latest local jobs
              </h2>
            </div>
          </div>

          {isLoading ? (
            <p className="rounded-2xl border border-border-glass bg-white/[0.03] p-5 text-sm text-text-secondary">
              Loading local history...
            </p>
          ) : logs.length === 0 ? (
            <p className="rounded-2xl border border-border-glass bg-white/[0.03] p-5 text-sm leading-6 text-text-secondary">
              No local history yet. Completed processing tasks will appear here after they are written to IndexedDB.
            </p>
          ) : (
            <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-2xl border border-border-glass bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-outfit text-sm font-black uppercase tracking-[0.16em] text-text-primary">
                      {log.tool}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {log.fileCount} file{log.fileCount === 1 ? '' : 's'} processed, {formatBytes(Math.max(0, log.totalOriginalSize - log.totalProcessedSize))} saved.
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

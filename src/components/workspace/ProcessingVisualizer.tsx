import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cpu, FileText, Gauge, ShieldCheck } from 'lucide-react';
import { useFileStore } from '../../store/useFileStore';
import { getEngineLabel, getPreferredEngine } from '../../services/conversionGateway';

const LOCAL_PROCESSING_STEPS = [
  'Reading file buffers locally...',
  'Assembling canvas streams...',
  'Compressing page structures...',
];

export const ProcessingVisualizer: React.FC = () => {
  const { status, progress, activeTool, conversionMode } = useFileStore();
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  const isProcessing = status === 'reading' || status === 'processing';

  useEffect(() => {
    if (!isProcessing || prefersReducedMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveStep((step) => (step + 1) % LOCAL_PROCESSING_STEPS.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [isProcessing, prefersReducedMotion]);

  useEffect(() => {
    if (status === 'reading') {
      setActiveStep(0);
    }
  }, [status]);

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const statusConfig = useMemo(() => {
    switch (status) {
      case 'reading':
        return {
          icon: Cpu,
          eyebrow: 'Stage 1 / Local intake',
          title: 'Preparing files',
        };
      case 'processing':
        return {
          icon: Gauge,
          eyebrow: 'Stage 2 / Worker pipeline',
          title: activeTool ? `Running ${activeTool}` : 'Processing PDF',
        };
      default:
        return {
          icon: FileText,
          eyebrow: 'Local pipeline',
          title: 'Processing PDF',
        };
    }
  }, [activeTool, status]);

  const StatusIcon = statusConfig.icon;
  const currentCopy = LOCAL_PROCESSING_STEPS[activeStep];
  const engineCopy = activeTool && isConversionTool(activeTool) && conversionMode
    ? getEngineLabel(getPreferredEngine(activeTool, conversionMode))
    : 'Zero-server local execution';
  const ringBackground = `conic-gradient(hsl(354, 76%, 49%) ${clampedProgress * 3.6}deg, rgba(255,255,255,0.08) 0deg)`;

  return (
    <div className="fixed inset-0 z-[110] flex w-full items-center justify-center px-4 py-10 bg-bg-dark/90 backdrop-blur-3xl transition-all duration-500">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border-glass bg-bg-card/55 p-6 text-center shadow-2xl backdrop-blur-2xl sm:p-10"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/70 to-transparent" />
        <motion.div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-primary/15 blur-3xl"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-glass bg-white/[0.04] px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">
              {engineCopy}
            </span>
          </div>

          <div
            className="relative mb-8 grid h-52 w-52 place-items-center rounded-full p-3 shadow-[0_0_60px_hsla(354,76%,49%,0.18)]"
            style={{ background: ringBackground }}
          >
            <div className="grid h-full w-full place-items-center rounded-full border border-border-glass bg-bg-dark/90 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  className="grid h-14 w-14 place-items-center rounded-2xl border border-brand-primary/25 bg-brand-primary/10 text-brand-primary"
                  animate={prefersReducedMotion ? undefined : { rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <StatusIcon className="h-7 w-7" />
                </motion.div>
                <span className="font-outfit text-4xl font-black italic tracking-tighter text-text-primary">
                  {clampedProgress}%
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">
                  Complete
                </span>
              </div>
            </div>
          </div>

          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-brand-primary">
            {statusConfig.eyebrow}
          </p>
          <h2 className="mb-4 font-outfit text-3xl font-black uppercase tracking-tight text-text-primary sm:text-4xl">
            {statusConfig.title}
          </h2>

          <motion.p
            key={currentCopy}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="min-h-7 text-base font-semibold text-text-secondary"
          >
            {currentCopy}
          </motion.p>

          <div className="mt-8 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-brand-primary shadow-[0_0_24px_hsla(354,76%,49%,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>

          <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2">
            {LOCAL_PROCESSING_STEPS.map((step, index) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  index <= activeStep ? 'bg-brand-primary' : 'bg-white/[0.08]'
                }`}
                aria-label={step}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function isConversionTool(tool: string): boolean {
  return [
    'wordToPdf',
    'powerPointToPdf',
    'excelToPdf',
    'htmlToPdf',
    'pdfToJpg',
    'pdfToWord',
    'pdfToPowerPoint',
    'pdfToExcel',
  ].includes(tool);
}

import React, { useEffect, useRef } from 'react';
import { useFileStore } from '../../store/useFileStore';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Download, CheckCircle, FileText, ArrowLeft, Heart, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadBlob } from '../../utils/downloadBlob';

export const SuccessScreen: React.FC = () => {
  const { status, processedBlob, processedFileName, processedNotice, clearQueue, donationStats, toggleDonationModal } = useFileStore();
  const downloadTriggered = useRef(false);

  useEffect(() => {
    if (status === 'success' && processedBlob) {
      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ee2e42', '#ffffff', '#22c55e']
      });

      // Programmatic Download
      if (!downloadTriggered.current) {
        downloadTriggered.current = true;
        downloadBlob(processedBlob, processedFileName || 'processed-document.pdf');

        // Donation Trigger: After 3 tasks or large file (>100MB)
        if (donationStats.totalTasksCompleted === 3 || processedBlob.size > 100 * 1024 * 1024) {
          setTimeout(() => toggleDonationModal(true), 1500);
        }
      }
    } else {
      downloadTriggered.current = false;
    }
  }, [status, processedBlob, processedFileName, donationStats.totalTasksCompleted, toggleDonationModal]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-bg-dark/90 backdrop-blur-3xl transition-all duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl p-12 rounded-[40px] border border-border-glass bg-bg-card/40 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-4xl md:text-5xl font-outfit font-black text-text-primary uppercase tracking-tighter mb-4">
          Processing <span className="text-green-500">Successful!</span>
        </h1>
        
        <p className="text-xl text-text-secondary font-medium mb-12 max-w-md mx-auto">
          Your file has been processed locally and downloaded automatically.
        </p>

        {processedNotice && (
          <div className="mb-8 flex w-full items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left text-sm font-semibold text-text-primary">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <span>{processedNotice}</span>
          </div>
        )}

        <div className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 mb-12 flex items-center gap-6 text-left overflow-hidden">
          <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
            <FileText className="w-8 h-8 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Output File</p>
            <p className="text-lg font-bold text-text-primary truncate font-mono">{processedFileName || 'processed-document.pdf'}</p>
          </div>
          <button 
            onClick={() => {
                if (processedBlob) {
                  downloadBlob(processedBlob, processedFileName || 'processed-document.pdf');
                }
            }}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-text-primary transition-all active:scale-95 border border-white/5"
            title="Download Again"
            aria-label="Download processed file again"
          >
            <Download className="w-6 h-6 text-brand-primary" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link 
            to="/"
            onClick={() => clearQueue()}
            className="flex-1 py-5 rounded-2xl bg-brand-primary text-white font-outfit font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(238,46,66,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tools
          </Link>
          <button 
            onClick={() => toggleDonationModal(true)}
            className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-text-primary font-outfit font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
            aria-label="Support privacy by donating"
          >
            <Heart className="w-5 h-5 text-brand-primary fill-brand-primary animate-pulse" />
            Support Privacy
          </button>
        </div>
      </motion.div>
    </div>
  );
};

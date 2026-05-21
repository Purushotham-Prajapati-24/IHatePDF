import React from 'react';
import { useFileStore } from '../../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Coffee, CreditCard, ShieldCheck, X, Zap } from 'lucide-react';
import { formatBytes } from '../../services/historyMetrics';

export const DonationModal: React.FC = () => {
  const { toggleDonationModal, donationStats, markDonated } = useFileStore();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-xl p-8 md:p-12 rounded-[40px] border border-border-glass bg-bg-card/60 shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={() => toggleDonationModal(false)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-amber-500 to-brand-primary animate-gradient-x" />

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_hsla(354,76%,49%,0.3)]">
            <Heart className="w-10 h-10 text-brand-primary fill-brand-primary" />
          </div>

          <h2 className="text-3xl font-outfit font-black text-text-primary uppercase tracking-tighter mb-4">
            Help us keep <br />
            <span className="text-brand-primary">IHatePDF</span> running
          </h2>
          
          <p className="text-text-secondary font-medium mb-10 max-w-md">
            We've saved you <span className="text-text-primary font-bold">{formatBytes(donationStats.totalBandwidthSavedBytes)}</span> of bandwidth and kept your files 100% private. 
            No ads, no trackers, just fast local processing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-10">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-500" />
                <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Privacy First</span>
                <span className="text-lg font-bold text-text-primary">100% Local</span>
            </div>
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Time Saved</span>
                <span className="text-lg font-bold text-text-primary">{Math.round(donationStats.totalTimeSavedSeconds / 60)} Mins</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <a 
              href="https://www.buymeacoffee.com" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => markDonated()}
              className="w-full py-5 rounded-2xl bg-[#FFDD00] text-black font-outfit font-black uppercase tracking-widest hover:brightness-105 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <Coffee className="w-6 h-6" />
              Buy me a coffee
            </a>
            <a 
              href="https://stripe.com" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => markDonated()}
              className="w-full py-5 rounded-2xl bg-white text-black font-outfit font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <CreditCard className="w-6 h-6" />
              Support with Stripe
            </a>
          </div>

          <p className="mt-8 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">
            Secure processing • Thank you for your support
          </p>
        </div>
      </motion.div>
    </div>
  );
};

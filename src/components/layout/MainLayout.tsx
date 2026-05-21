import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DropZone } from '../workspace/DropZone';
import { ProcessingVisualizer } from '../workspace/ProcessingVisualizer';
import { SuccessScreen } from '../workspace/SuccessScreen';
import { DonationModal } from '../dashboard/DonationModal';
import { useFileStore } from '../../store/useFileStore';
import { AnimatePresence } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { status, isDonationModalOpen } = useFileStore();
  
  const isProcessing = status === 'reading' || status === 'processing';
  const isSuccess = status === 'success';

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      <DropZone />
      
      <AnimatePresence mode="wait">
        {isProcessing && <ProcessingVisualizer key="visualizer" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSuccess && <SuccessScreen key="success" />}
      </AnimatePresence>

      <AnimatePresence>
        {isDonationModalOpen && <DonationModal key="donation" />}
      </AnimatePresence>

      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
};

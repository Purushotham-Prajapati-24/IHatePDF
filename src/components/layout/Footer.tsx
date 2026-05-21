import React from 'react';
import { Heart, Github, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-glass bg-bg-dark/40 backdrop-blur-md mt-auto transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-outfit font-bold text-lg text-text-primary">
            IHate<span className="text-brand-primary">PDF</span>
          </span>
          <span className="text-sm text-text-secondary mt-1 text-center md:text-left">
            Built with frustration. Processed locally with care.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Twitter className="w-4 h-4" />
            <span>Updates</span>
          </a>
        </div>

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-brand-primary animate-pulse" />
          <span>for Privacy</span>
        </div>
      </div>
    </footer>
  );
};

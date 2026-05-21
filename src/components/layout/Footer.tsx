import React from 'react';
import { Heart, Github, Twitter, Shield, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-glass bg-bg-dark/40 backdrop-blur-md mt-auto transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <span className="font-outfit font-bold text-2xl text-text-primary">
              IHate<span className="text-brand-primary">PDF</span>
            </span>
            <p className="text-sm text-text-secondary leading-relaxed">
              The ultimate 100% private iLovePDF alternative. We process your documents directly in your browser using local WASM engines. No uploads, no servers, zero risk.
            </p>
            <div className="flex gap-4 mt-2">
              <Shield className="w-5 h-5 text-brand-primary" />
              <Zap className="w-5 h-5 text-brand-primary" />
              <Lock className="w-5 h-5 text-brand-primary" />
            </div>
          </div>

          {/* Tools Column 1 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-outfit font-bold text-sm uppercase tracking-widest text-text-primary">PDF Editing</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/tool/merge" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Merge PDF</Link>
              <Link to="/tool/split" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Split PDF</Link>
              <Link to="/tool/compress" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Compress PDF</Link>
              <Link to="/tool/edit" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Edit PDF</Link>
              <Link to="/tool/crop" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Crop PDF</Link>
            </nav>
          </div>

          {/* Tools Column 2 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-outfit font-bold text-sm uppercase tracking-widest text-text-primary">Conversion</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/tool/pdfToWord" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">PDF to Word</Link>
              <Link to="/tool/wordToPdf" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Word to PDF</Link>
              <Link to="/tool/pdfToPowerPoint" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">PDF to PowerPoint</Link>
              <Link to="/tool/excelToPdf" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Excel to PDF</Link>
              <Link to="/tool/jpgToPdf" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">JPG to PDF</Link>
            </nav>
          </div>

          {/* Security Column */}
          <div className="flex flex-col gap-4">
            <h4 className="font-outfit font-bold text-sm uppercase tracking-widest text-text-primary">Security & OCR</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/tool/ocr" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">OCR PDF</Link>
              <Link to="/tool/protect" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Protect PDF</Link>
              <Link to="/tool/unlock" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Unlock PDF</Link>
              <Link to="/tool/repair" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">Repair PDF</Link>
              <Link to="/tool/forms" className="text-sm text-text-secondary hover:text-brand-primary transition-colors">PDF Forms</Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border-glass pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
            <span>for Digital Sovereignty & Privacy</span>
          </div>

          <div className="text-xs text-text-secondary/60 uppercase font-black tracking-widest">
            © 2026 IHatePDF - 100% Local & Secure
          </div>
        </div>
      </div>
    </footer>
  );
};

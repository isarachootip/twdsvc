import React, { useEffect } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  documentTitle?: string;
  children: React.ReactNode;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  maxWidthClass?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title = 'ตัวอย่างก่อนพิมพ์',
  documentTitle,
  children,
  onPrint,
  onDownloadPdf,
  maxWidthClass = 'max-w-4xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/50 backdrop-blur-xs">
      <div
        className={cn(
          'w-full bg-surface rounded-card shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150',
          maxWidthClass
        )}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-border bg-surface-2/60 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            {documentTitle && (
              <p className="text-xs text-text-mute">{documentTitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-input border border-border-strong bg-surface hover:bg-surface-2 text-text transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ดาวน์โหลด PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-input bg-red hover:bg-red-dark text-white shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-input text-text-mute hover:text-text hover:bg-surface-2 transition-colors ml-1"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface-2/30 flex justify-center">
          <div className="w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 bg-white shadow-sm border border-border print:shadow-none print:border-none print:m-0 print:p-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

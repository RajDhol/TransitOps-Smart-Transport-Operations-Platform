'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm font-sans">
      {/* Modal Container: Accent border top, solid border, zero shadows */}
      <div className="w-full max-w-lg bg-white border border-gray-300 border-t-4 border-t-indigo-600 rounded-md flex flex-col max-h-[90vh]">
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-250 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
          
          {/* Close button with circular layout */}
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 hover:border-gray-400 bg-white text-gray-500 hover:text-gray-900 transition-colors select-none outline-none text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

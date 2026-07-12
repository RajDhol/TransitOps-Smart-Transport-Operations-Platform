'use client';

import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [animate, setAnimate] = useState(false);

  // Trigger micro-animation on mount/unmount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Small delay to trigger animation transition
      const timer = setTimeout(() => setAnimate(true), 20);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md transition-opacity duration-300 font-sans ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Modal Container: Accent border top, solid border, zero shadows */}
      <div
        className={`w-full max-w-lg bg-white border border-gray-300 border-t-4 border-t-indigo-600 rounded-md flex flex-col max-h-[90vh] transition-all duration-300 transform ${
          animate ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150 bg-gray-50/50">
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

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  zIndex?: 'base' | 'elevated' | 'overlay';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  zIndex = 'base'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const zIndexClasses = {
    base: 'z-40',      // Standard modals (lowest)
    elevated: 'z-50',  // Container modals that can open other modals
    overlay: 'z-60'    // Modals that appear over other modals (highest)
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClasses[zIndex]} overflow-y-auto animate-in fade-in duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-all duration-300 backdrop-blur-sm bg-black/40" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-gradient-to-br from-white via-white to-gray-50/80 rounded-2xl text-left overflow-hidden shadow-2xl border border-white/20 backdrop-blur-xl transform transition-all duration-300 animate-in slide-in-from-bottom-4 sm:my-8 sm:align-middle w-full ${sizeClasses[size]}`}>
          <div className="bg-gradient-to-r from-transparent via-white/20 to-transparent px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100/80 transition-all duration-200 hover:scale-110"
              >
                <X size={18} className="text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
            <div className="relative">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

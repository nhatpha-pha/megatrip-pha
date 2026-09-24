import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
};

export function Modal({ open, onOpenChange, children, size = 'xl' }: ModalProps) {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-4xl',
        xl: 'max-w-5xl',
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center ">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => onOpenChange?.(false)}
                aria-hidden
            />
            <div className={`relative w-full ${sizeClasses[size]} mx-4`} >
                {children}
            </div>
        </div>,
        document.body
    );
}

export function ModalContent({ children, className }: { children?: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden max-h-[92vh] overflow-y-auto ${className || ''}`}>
            {children}
        </div>
    );
}

export function ModalHeader({ children }: { children?: React.ReactNode }) {
    return <div className="p-4 border-b">{children}</div>;
}

export function ModalTitle({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-lg font-medium">{children}</h3>;
}

export function ModalDescription({ children }: { children?: React.ReactNode }) {
    return <div className="text-sm text-muted-foreground mt-1">{children}</div>;
}

export function ModalFooter({ children }: { children?: React.ReactNode }) {
    return <div className="p-4 border-t flex justify-end gap-2">{children}</div>;
}

export default Modal;
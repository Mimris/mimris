import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 12
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={overlayStyle}
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className="relative w-full max-w-md"
        style={{ pointerEvents: 'auto', width: '100%', maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-lg bg-white shadow-xl"
      style={{ padding: 10, fontSize: 12, lineHeight: 1.25, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.18)', border: '1px solid #e5e7eb' }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 space-y-1">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold leading-tight text-gray-900" style={{ fontSize: 13 }}>{children}</h2>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-snug text-gray-600" style={{ fontSize: 11 }}>{children}</p>;
}

export function DialogFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 flex flex-wrap items-center justify-end gap-2 ${className}`}>{children}</div>;
}

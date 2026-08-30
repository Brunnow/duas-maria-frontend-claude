import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { cn } from '@/lib/cn';

const sizes = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Modal centralizado com backdrop e transicoes.
 * Baseado no Dialog do Headless UI (foco preso, fecha por ESC/backdrop).
 */
export default function Modal({ open, onClose, title, children, footer, size = 'lg', className }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={cn(
              'w-full rounded-card bg-surface shadow-pop transition-all duration-200',
              'data-[closed]:scale-95 data-[closed]:opacity-0',
              sizes[size],
              className,
            )}
          >
            {(title || onClose) && (
              <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
                {title && (
                  <DialogTitle className="font-display text-xl text-foreground">
                    {title}
                  </DialogTitle>
                )}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="ml-auto rounded-control p-1 text-muted transition-colors hover:bg-subtle hover:text-foreground"
                  >
                    <MdClose size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
            {footer && (
              <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                {footer}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

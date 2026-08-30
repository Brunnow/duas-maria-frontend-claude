import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { cn } from '@/lib/cn';

const sides = {
  right: {
    wrap: 'justify-end',
    panel: 'right-0 max-w-md data-[closed]:translate-x-full',
  },
  left: {
    wrap: 'justify-start',
    panel: 'left-0 max-w-sm data-[closed]:-translate-x-full',
  },
};

/**
 * Painel lateral deslizante (carrinho, menu mobile, filtros).
 * `side` = 'right' (padrao) ou 'left'.
 */
export default function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  children,
  footer,
  className,
}) {
  const s = sides[side];
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0"
      />
      <div className={cn('fixed inset-0 flex', s.wrap)}>
        <DialogPanel
          transition
          className={cn(
            'fixed inset-y-0 flex w-full flex-col bg-surface shadow-pop transition-transform duration-300 ease-out',
            s.panel,
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            {title && (
              <DialogTitle className="font-display text-lg text-foreground">{title}</DialogTitle>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="ml-auto rounded-control p-1 text-muted transition-colors hover:bg-subtle hover:text-foreground"
            >
              <MdClose size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

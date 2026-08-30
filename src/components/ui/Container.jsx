import { cn } from '@/lib/cn';

/**
 * Wrapper de largura maxima e respiro horizontal padrao do site.
 * Substitui os paddings repetidos (lg:px-14 sm:px-8 px-4 ...).
 */
export default function Container({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cn('mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

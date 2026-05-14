import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Accessible breadcrumb trail. Pass an array of items where the last
 * item is the current page (no href needed, rendered as plain text).
 *
 * @example
 * <Breadcrumb items={[
 *   { label: 'Products', href: '/products' },
 *   { label: 'Suits', href: '/products?category=Suits' },
 *   { label: 'Blue Cotton Suit' },
 * ]} />
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center flex-wrap gap-1 text-sm text-gray-500 ${className}`}
    >
      {/* Home icon always first */}
      <Link
        href="/"
        className="flex items-center hover:text-primary-600 transition-colors shrink-0"
        aria-label="Home"
      >
        <FiHome size={14} />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1 min-w-0">
            <FiChevronRight size={13} className="text-gray-300 shrink-0" aria-hidden />
            {isLast || !item.href ? (
              <span
                className={`truncate max-w-[180px] sm:max-w-none ${
                  isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary-600 transition-colors truncate max-w-[140px] sm:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

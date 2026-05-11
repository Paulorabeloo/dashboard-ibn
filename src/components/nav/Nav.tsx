'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Visão geral', icon: '📊', desc: 'Como está o ciclo' },
  { href: '/dia', label: 'Dia', icon: '📅', desc: 'Foco em hoje' },
  { href: '/vendas', label: 'Vendas do mês', icon: '💰', desc: 'Performance do mês' },
  { href: '/vendedoras', label: 'Vendedoras', icon: '👥', desc: 'Quem vende mais' },
  { href: '/polos', label: 'Polos', icon: '🏢', desc: 'Performance regional' },
  { href: '/campanhas', label: 'Campanhas', icon: '🎯', desc: 'Origem das matrículas' },
] as const;

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3 text-sm">
      {ITEMS.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-start gap-2.5 rounded-md px-2.5 py-2 transition-colors ${
              active
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <span className="mt-0.5 text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span className="flex flex-col leading-tight">
              <span>{item.label}</span>
              <span className="text-[10px] text-muted-foreground/80">{item.desc}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

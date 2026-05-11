'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { CICLOS } from '@/lib/cycles';

interface FilterBarProps {
  readonly polosOptions: ReadonlyArray<{ id: string; label: string }>;
  readonly mesOptions: ReadonlyArray<{ id: string; label: string }>;
}

const PRODUTO_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'graduacao', label: 'Graduação' },
  { id: 'pos', label: 'Pós-graduação' },
  { id: 'tecnico', label: 'Técnicos' },
] as const;

export function FilterBar({ polosOptions, mesOptions }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === '') sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `?${qs}` : '?', { scroll: false });
      });
    },
    [router, searchParams],
  );

  const cicloAtual = searchParams.get('ciclo') ?? '';
  const familiaAtual = searchParams.get('familia') ?? 'all';
  const poloAtual = searchParams.get('polo') ?? 'all';
  const mesAtual = searchParams.get('mes') ?? 'all';
  const diaAtual = searchParams.get('dia') ?? '';

  const hasFilter =
    Boolean(searchParams.get('ciclo')) ||
    Boolean(searchParams.get('familia')) ||
    Boolean(searchParams.get('polo')) ||
    Boolean(searchParams.get('mes')) ||
    Boolean(searchParams.get('dia')) ||
    Boolean(searchParams.get('de')) ||
    Boolean(searchParams.get('ate'));

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5"
      aria-busy={isPending}
    >
      <FilterSelect
        label="Ciclo"
        value={cicloAtual}
        onChange={(v) => update({ ciclo: v || null })}
        options={[
          { value: '', label: 'Atual' },
          ...CICLOS.map((c) => ({ value: c.id, label: c.id })),
          { value: 'all', label: 'Todos' },
        ]}
      />
      <FilterSelect
        label="Mês"
        value={mesAtual}
        onChange={(v) => update({ mes: v === 'all' ? null : v, dia: null })}
        disabled={Boolean(diaAtual)}
        options={[
          { value: 'all', label: 'Todos' },
          ...mesOptions.map((m) => ({ value: m.id, label: m.label })),
        ]}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Dia</span>
        <input
          type="date"
          value={diaAtual}
          onChange={(e) => update({ dia: e.target.value || null })}
          className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </label>
      <FilterSelect
        label="Polo"
        value={poloAtual}
        onChange={(v) => update({ polo: v === 'all' ? null : v })}
        options={[
          { value: 'all', label: 'Todos' },
          ...polosOptions.map((p) => ({ value: p.id, label: p.label })),
        ]}
      />
      <FilterSelect
        label="Produto"
        value={familiaAtual}
        onChange={(v) => update({ familia: v === 'all' ? null : v })}
        options={PRODUTO_OPTIONS.map((f) => ({ value: f.id, label: f.label }))}
      />

      {hasFilter && (
        <button
          type="button"
          onClick={() =>
            update({
              ciclo: null,
              polo: null,
              familia: null,
              mes: null,
              dia: null,
              de: null,
              ate: null,
            })
          }
          className="ml-auto rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

interface FilterSelectProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: ReadonlyArray<{ value: string; label: string }>;
  readonly disabled?: boolean;
}

function FilterSelect({ label, value, onChange, options, disabled }: FilterSelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

import { countByPolo } from '@/lib/aggregations/countByDimension';
import { outliersPorPolo } from '@/lib/aggregations/outliers';
import { topBottomPolos } from '@/lib/aggregations/topBottomPolos';
import { loadDashboardContext } from '@/lib/dashboardContext';

import { AnomalySummary } from '@/components/charts/AnomalyBadge';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { Section } from '@/components/charts/Section';
import { FilterBar } from '@/components/filters/FilterBar';
import { Delta } from '@/components/kpi/Delta';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/page/PageHeader';

/*
 * Polos — responde "qual polo precisa de atenção?".
 * Performance regional, top/bottom em destaque, distribuição.
 */

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Polos({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint } =
    await loadDashboardContext(sp);

  const polos = countByPolo(data, filter);
  const tb = topBottomPolos(data, filter, 5);
  const outliers = outliersPorPolo(data, filter);
  const altos = outliers.outliers.filter((o) => o.tipo === 'alto');
  const baixos = outliers.outliers.filter((o) => o.tipo === 'baixo');

  const totalRecorte = polos.reduce((s, p) => s + p.total, 0);
  const top3 = polos.slice(0, 3);
  const top3Pct =
    totalRecorte > 0
      ? (top3.reduce((s, p) => s + p.total, 0) / totalRecorte) * 100
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Polos"
        description="Performance regional. Identifique polos em alta e em queda para alocar atenção."
        updatedAtMin={updatedAtMin}
        stale={data.stale}
        totalKnown={data.matriculas.length}
        recorteHint={recorteHint}
      />

      <FilterBar polosOptions={polosOptions} mesOptions={mesOptions} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Polos com matrícula"
          icon="🏢"
          accentColor="#3b82f6"
          value={polos.length.toLocaleString('pt-BR')}
          hint="no recorte selecionado"
        />
        <KPICard
          label="Concentração top 3"
          icon="🎯"
          accentColor="#8b5cf6"
          value={`${top3Pct.toFixed(0)}%`}
          hint={`top 3 = ${top3.reduce((s, p) => s + p.total, 0).toLocaleString('pt-BR')} matrículas`}
        />
        <KPICard
          label="Polo top 1"
          icon="👑"
          accentColor="#10b981"
          value={polos[0] ? <span className="block truncate text-2xl">{polos[0].label}</span> : '—'}
          hint={polos[0] ? `${polos[0].total.toLocaleString('pt-BR')} matrículas` : undefined}
        />
        <KPICard
          label="Maior queda"
          icon="📉"
          accentColor="#ef4444"
          value={
            tb.bottom[0] && tb.bottom[0].deltaAbs < 0 ? (
              <span className="block truncate text-2xl">{tb.bottom[0].polo.nomeCanonico}</span>
            ) : (
              '—'
            )
          }
          hint={
            tb.bottom[0] && tb.bottom[0].deltaAbs < 0
              ? `${Math.abs(tb.bottom[0].deltaAbs)} a menos vs ciclo anterior`
              : 'sem queda vs ciclo anterior'
          }
        />
      </section>

      {(altos.length > 0 || baixos.length > 0) && (
        <Section
          title="Anomalias estatísticas"
          hint={`Z-score ≥ 1.5 · média ${outliers.media.toFixed(0)} matrículas/polo · desvio ${outliers.desvio.toFixed(0)}`}
        >
          <AnomalySummary altos={altos} baixos={baixos} label="entre polos" />
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Top 5 — em alta" hint="Maior crescimento absoluto vs ciclo anterior">
          <ul className="divide-y divide-border text-sm">
            {tb.top.map((p, i) => (
              <li key={p.polo.id} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-3">
                  <span className="w-5 text-right tabular text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="font-medium">{p.polo.nomeCanonico}</span>
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="tabular text-muted-foreground">
                    {p.atual.toLocaleString('pt-BR')}
                  </span>
                  <Delta value={p.deltaAbs} format="abs" />
                </span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Bottom 5 — em queda" hint="Maior queda absoluta vs ciclo anterior">
          <ul className="divide-y divide-border text-sm">
            {tb.bottom.map((p, i) => (
              <li key={p.polo.id} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-3">
                  <span className="w-5 text-right tabular text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="font-medium">{p.polo.nomeCanonico}</span>
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="tabular text-muted-foreground">
                    {p.atual.toLocaleString('pt-BR')}
                  </span>
                  <Delta value={p.deltaAbs} format="abs" />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Performance por polo (todos)" hint="Ranking completo no recorte">
        <HorizontalBars data={polos} maxItems={polos.length} />
      </Section>
    </div>
  );
}

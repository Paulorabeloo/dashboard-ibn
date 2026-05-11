import { outliersPorVendedora } from '@/lib/aggregations/outliers';
import { paretoVendedoras } from '@/lib/aggregations/pareto';
import { heatmapVendedoraProduto } from '@/lib/aggregations/heatmapVendedoraProduto';
import { rankingVendedoras } from '@/lib/aggregations/rankingVendedoras';
import { loadDashboardContext } from '@/lib/dashboardContext';

import { AnomalySummary } from '@/components/charts/AnomalyBadge';
import { Heatmap } from '@/components/charts/Heatmap';
import { ParetoChart } from '@/components/charts/ParetoChart';
import { RankingTable } from '@/components/charts/RankingTable';
import { Section } from '@/components/charts/Section';
import { FilterBar } from '@/components/filters/FilterBar';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/page/PageHeader';

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Vendedoras({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint } =
    await loadDashboardContext(sp);

  const ranking = rankingVendedoras(data, filter);
  const heatmap = heatmapVendedoraProduto(data, filter, 15);
  const pareto = paretoVendedoras(data, filter, 25);
  const outliers = outliersPorVendedora(data, filter);

  const top5Pct = pareto.top5Pct;
  const top10Pct = pareto.top10Pct;
  const top5Total = pareto.entries.slice(0, 5).reduce((s, e) => s + e.total, 0);
  const top10Total = pareto.entries.slice(0, 10).reduce((s, e) => s + e.total, 0);

  const altos = outliers.outliers.filter((o) => o.tipo === 'alto');
  const baixos = outliers.outliers.filter((o) => o.tipo === 'baixo');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendedoras"
        description="Quem está performando, em que produto e onde focar coaching."
        updatedAtMin={updatedAtMin}
        stale={data.stale}
        totalKnown={data.matriculas.length}
        recorteHint={recorteHint}
      />

      <FilterBar polosOptions={polosOptions} mesOptions={mesOptions} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Vendedoras ativas"
          icon="👥"
          accentColor="#3b82f6"
          value={ranking.length.toLocaleString('pt-BR')}
          hint={`com ao menos 1 matrícula no recorte`}
        />
        <KPICard
          label="Concentração top 5"
          icon="🥇"
          accentColor="#8b5cf6"
          value={`${top5Pct.toFixed(0)}%`}
          hint={`top 5 = ${top5Total.toLocaleString('pt-BR')} matrículas`}
        />
        <KPICard
          label="Concentração top 10"
          icon="🏅"
          accentColor="#10b981"
          value={`${top10Pct.toFixed(0)}%`}
          hint={`top 10 = ${top10Total.toLocaleString('pt-BR')} matrículas`}
        />
        <KPICard
          label="Top 1"
          icon="👑"
          accentColor="#f59e0b"
          value={
            ranking[0] ? (
              <span className="block truncate text-2xl">{ranking[0].nome}</span>
            ) : (
              '—'
            )
          }
          hint={
            ranking[0]
              ? `${ranking[0].total} matrículas · ${ranking[0].poloPrincipalNome ?? '—'}`
              : undefined
          }
        />
      </section>

      {(altos.length > 0 || baixos.length > 0) && (
        <Section
          title="Anomalias estatísticas"
          hint={`Z-score ≥ 1.5 · média ${outliers.media.toFixed(0)} · desvio ${outliers.desvio.toFixed(0)}`}
        >
          <AnomalySummary altos={altos} baixos={baixos} label="entre vendedoras" />
        </Section>
      )}

      <Section
        title="Pareto · concentração de performance"
        hint="Barras = matrículas. Linha vermelha = % acumulado. Topo da linha em 80% = sua dependência crítica."
      >
        <ParetoChart entries={pareto.entries} />
      </Section>

      <Section
        title="Especialização por produto"
        hint="Top 15 vendedoras × produto. Cor = volume; % = participação dentro da vendedora."
      >
        <Heatmap data={heatmap} />
      </Section>

      <Section
        title="Ranking completo"
        hint={`Todas as ${ranking.length} vendedoras do recorte, ordenadas por volume.`}
      >
        <RankingTable data={ranking} limit={ranking.length} />
      </Section>
    </div>
  );
}

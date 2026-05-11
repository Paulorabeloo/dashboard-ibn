import { countByPolo } from '@/lib/aggregations/countByDimension';
import { evolucaoTemporal } from '@/lib/aggregations/evolucaoTemporal';
import { heatmapDiaHora } from '@/lib/aggregations/heatmapDiaHora';
import { mixFamilia } from '@/lib/aggregations/mixFamilia';
import { pace7d } from '@/lib/aggregations/pace7d';
import { rankingVendedoras } from '@/lib/aggregations/rankingVendedoras';
import { totalMatriculas } from '@/lib/aggregations/totalMatriculas';
import { loadDashboardContext } from '@/lib/dashboardContext';

import { EvolucaoChart } from '@/components/charts/EvolucaoChart';
import { HeatmapDiaHora } from '@/components/charts/HeatmapDiaHora';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { MixDonut } from '@/components/charts/MixDonut';
import { RankingTable } from '@/components/charts/RankingTable';
import { Section } from '@/components/charts/Section';
import { Sparkline } from '@/components/charts/Sparkline';
import { FilterBar } from '@/components/filters/FilterBar';
import { Delta } from '@/components/kpi/Delta';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/page/PageHeader';

/*
 * Vendas do mês — responde "como está o mês?".
 * Default: mês atual. Foco em performance dia-a-dia + top performers.
 */

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KPI_COLORS = {
  matriculas: '#3b82f6',
  pace: '#8b5cf6',
  topVend: '#10b981',
  topPolo: '#f59e0b',
} as const;

export default async function VendasMes({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint } =
    await loadDashboardContext(sp, { defaultMesAtual: true });

  const ns1 = totalMatriculas(data, filter);
  const ns2 = pace7d(data, filter);
  const ns3 = mixFamilia(data, filter);
  const evolucao = evolucaoTemporal(data, filter);
  const ranking = rankingVendedoras(data, filter);
  const polos = countByPolo(data, filter);
  const heatDH = heatmapDiaHora(data, filter);

  const spark = evolucao.slice(-14);
  const tendenciaArrow =
    ns2.tendencia === 'up' ? '↗' : ns2.tendencia === 'down' ? '↘' : '→';
  const tendenciaLabel =
    ns2.tendencia === 'up' ? 'em alta' : ns2.tendencia === 'down' ? 'em queda' : 'estável';

  const topVendedora = ranking[0];
  const topPolo = polos[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas do mês"
        description="Como está o mês. Default no mês atual; troque pelo filtro para outro período."
        updatedAtMin={updatedAtMin}
        stale={data.stale}
        totalKnown={data.matriculas.length}
        recorteHint={recorteHint}
      />

      <FilterBar polosOptions={polosOptions} mesOptions={mesOptions} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Matrículas no recorte"
          icon="📈"
          accentColor={KPI_COLORS.matriculas}
          value={ns1.atual.toLocaleString('pt-BR')}
          detail={
            ns1.hasComparison ? (
              <Delta value={ns1.deltaAbs} pct={ns1.deltaPct} />
            ) : (
              <span className="text-xs text-muted-foreground">sem comparação</span>
            )
          }
          hint={
            ns1.hasComparison
              ? `vs ${ns1.anterior.toLocaleString('pt-BR')} no mesmo período do ciclo anterior`
              : 'no recorte selecionado'
          }
          sparkline={<Sparkline data={spark} color={KPI_COLORS.matriculas} />}
        />

        <KPICard
          label="Pace 7d"
          icon="⚡"
          accentColor={KPI_COLORS.pace}
          value={ns2.mediaMovel.toFixed(1)}
          detail={
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span aria-hidden="true">{tendenciaArrow}</span>
              <span>{tendenciaLabel}</span>
            </span>
          }
          hint={`${ns2.atual} matrículas nos últimos 7d (vs ${ns2.anterior} antes)`}
          sparkline={<Sparkline data={spark} color={KPI_COLORS.pace} />}
        />

        <KPICard
          label="Top vendedora"
          icon="👑"
          accentColor={KPI_COLORS.topVend}
          value={
            topVendedora ? (
              <span className="block truncate text-2xl">{topVendedora.nome}</span>
            ) : (
              '—'
            )
          }
          detail={
            topVendedora ? (
              <span className="text-xs text-muted-foreground tabular">
                {topVendedora.total.toLocaleString('pt-BR')} matrículas{' '}
                {topVendedora.deltaAbs !== 0 && (
                  <Delta value={topVendedora.deltaAbs} format="abs" />
                )}
              </span>
            ) : null
          }
          hint={topVendedora?.poloPrincipalNome ?? undefined}
        />

        <KPICard
          label="Top polo"
          icon="🏢"
          accentColor={KPI_COLORS.topPolo}
          value={
            topPolo ? <span className="block truncate text-2xl">{topPolo.label}</span> : '—'
          }
          detail={
            topPolo ? (
              <span className="text-xs text-muted-foreground tabular">
                {topPolo.total.toLocaleString('pt-BR')} matrículas ({topPolo.pct.toFixed(0)}%
                do recorte)
              </span>
            ) : null
          }
          hint="polo com maior volume no período"
        />
      </section>

      <Section
        title="Evolução de matrículas no recorte"
        hint="Acompanhe o ritmo dia-a-dia."
      >
        <EvolucaoChart data={evolucao} />
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Mix de produto no recorte" hint="O que está vendendo">
          <MixDonut data={ns3} />
        </Section>
        <div className="lg:col-span-2">
          <Section title="Top 10 vendedoras" hint="Ranking pelo recorte selecionado">
            <RankingTable data={ranking} limit={10} />
          </Section>
        </div>
      </div>

      <Section title="Top polos no recorte" hint="Onde as matrículas estão concentradas">
        <HorizontalBars data={polos} maxItems={10} />
      </Section>

      <Section
        title="Heatmap dia × hora"
        hint="Quando as matrículas entram. Cor mais escura = mais matrículas."
      >
        <HeatmapDiaHora data={heatDH} />
      </Section>
    </div>
  );
}

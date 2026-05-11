import { statsIndicacao } from '@/lib/aggregations/amigoValePix';
import { cohortByCycle } from '@/lib/aggregations/cohortByCycle';
import { countByPolo } from '@/lib/aggregations/countByDimension';
import { evolucaoTemporal } from '@/lib/aggregations/evolucaoTemporal';
import { projecaoFechamento } from '@/lib/aggregations/forecast';
import { mixFamilia } from '@/lib/aggregations/mixFamilia';
import { pace7d } from '@/lib/aggregations/pace7d';
import { topBottomPolos } from '@/lib/aggregations/topBottomPolos';
import { totalMatriculas } from '@/lib/aggregations/totalMatriculas';
import { loadDashboardContext } from '@/lib/dashboardContext';

import { CohortChart } from '@/components/charts/CohortChart';
import { EvolucaoChart } from '@/components/charts/EvolucaoChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { MixDonut } from '@/components/charts/MixDonut';
import { Section } from '@/components/charts/Section';
import { Sparkline } from '@/components/charts/Sparkline';
import { FilterBar } from '@/components/filters/FilterBar';
import { Delta } from '@/components/kpi/Delta';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/page/PageHeader';

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KPI_COLORS = {
  matriculas: '#3b82f6',
  projecao: '#8b5cf6',
  conversao: '#10b981',
  polos: '#f59e0b',
} as const;

export default async function VisaoGeral({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint } =
    await loadDashboardContext(sp);

  const ns1 = totalMatriculas(data, filter);
  const ns2 = pace7d(data, filter);
  const ns3 = mixFamilia(data, filter);
  const ns4 = topBottomPolos(data, filter);
  const indicacao = statsIndicacao(data, filter);
  const evolucao = evolucaoTemporal(data, filter);
  const polos = countByPolo(data, filter);
  const forecast = projecaoFechamento(data, filter);
  const cohort = cohortByCycle(data);

  const spark14 = evolucao.slice(-14);
  const tendenciaArrow =
    ns2.tendencia === 'up' ? '↗' : ns2.tendencia === 'down' ? '↘' : '→';
  const tendenciaLabel =
    ns2.tendencia === 'up' ? 'em alta' : ns2.tendencia === 'down' ? 'em queda' : 'estável';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Como está o ciclo. Use o filtro para reduzir o recorte."
        updatedAtMin={updatedAtMin}
        stale={data.stale}
        totalKnown={data.matriculas.length}
        recorteHint={recorteHint}
      />

      <FilterBar polosOptions={polosOptions} mesOptions={mesOptions} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Matrículas no ciclo"
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
              ? `vs ${ns1.anterior.toLocaleString('pt-BR')} no mesmo ponto do ciclo anterior`
              : 'no recorte selecionado'
          }
          sparkline={<Sparkline data={spark14} color={KPI_COLORS.matriculas} />}
        />

        <KPICard
          label="Projeção fechamento"
          icon="🔮"
          accentColor={KPI_COLORS.projecao}
          value={forecast.confiavel ? forecast.projetado.toLocaleString('pt-BR') : '—'}
          detail={
            forecast.confiavel && forecast.cicloAnteriorTotal > 0 ? (
              <Delta
                value={forecast.deltaVsAnterior}
                pct={forecast.deltaVsAnteriorPct}
                format="pct"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {forecast.confiavel ? 'sem ciclo anterior' : 'dados insuficientes'}
              </span>
            )
          }
          hint={
            forecast.confiavel
              ? `${forecast.ritmoDiario.toFixed(1)}/dia · ${forecast.diasRestantes} dias restantes`
              : 'esperando histórico mínimo'
          }
        />

        <KPICard
          label="Via indicação"
          icon="🎯"
          accentColor={KPI_COLORS.conversao}
          value={indicacao.matriculasIndicacao.toLocaleString('pt-BR')}
          detail={
            <span className="text-xs text-muted-foreground">
              {indicacao.pctOrigem.toFixed(1)}% do total
            </span>
          }
          hint={`${indicacao.comIndicadoPor} com 'Indicado por' preenchido`}
        />

        <KPICard
          label="Pace 7d"
          icon="⚡"
          accentColor={KPI_COLORS.polos}
          value={ns2.mediaMovel.toFixed(1)}
          detail={
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span aria-hidden="true">{tendenciaArrow}</span>
              <span>{tendenciaLabel}</span>
            </span>
          }
          hint={`${ns2.atual} nos últimos 7d (vs ${ns2.anterior})`}
          sparkline={<Sparkline data={spark14} color={KPI_COLORS.polos} />}
        />
      </section>

      <Section
        title="Cohort por ciclo"
        hint="Compara matrículas acumuladas em cada ciclo no mesmo dia desde o início. Linha em destaque = ciclo atual."
      >
        <CohortChart
          series={cohort}
          currentCicloId={filter.cicloId !== 'all' ? filter.cicloId : undefined}
        />
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Mix de produto" hint="Participação por categoria">
          <MixDonut data={ns3} />
        </Section>
        <div className="lg:col-span-2">
          <Section
            title="Evolução de matrículas"
            hint="Linha cheia: dia atual. Tracejado: média móvel 7d. Pontilhado: ciclo anterior."
          >
            <EvolucaoChart data={evolucao} />
          </Section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Top / Bottom 3 polos"
          hint="Variação em volume vs mesmo ponto do ciclo anterior"
        >
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-positive">
                ↑ Em alta
              </div>
              <ul className="divide-y divide-border">
                {ns4.top.slice(0, 3).map((p) => (
                  <li key={p.polo.id} className="flex items-center justify-between py-1.5">
                    <span>{p.polo.nomeCanonico}</span>
                    <Delta value={p.deltaAbs} format="abs" />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-negative">
                ↓ Em queda
              </div>
              <ul className="divide-y divide-border">
                {ns4.bottom.slice(0, 3).map((p) => (
                  <li key={p.polo.id} className="flex items-center justify-between py-1.5">
                    <span>{p.polo.nomeCanonico}</span>
                    <Delta value={p.deltaAbs} format="abs" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
        <Section title="Performance por polo" hint={`${polos.length} polos no recorte`}>
          <HorizontalBars data={polos} maxItems={10} />
        </Section>
      </div>
    </div>
  );
}

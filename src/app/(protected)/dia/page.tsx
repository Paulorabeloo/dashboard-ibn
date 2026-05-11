import { countByPolo } from '@/lib/aggregations/countByDimension';
import { mixFamilia } from '@/lib/aggregations/mixFamilia';
import { rankingVendedoras } from '@/lib/aggregations/rankingVendedoras';
import { totalMatriculas } from '@/lib/aggregations/totalMatriculas';
import { applyFilter, type Filter } from '@/lib/filters';
import { formatDiaLabel, loadDashboardContext } from '@/lib/dashboardContext';

import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { MixDonut } from '@/components/charts/MixDonut';
import { RankingTable } from '@/components/charts/RankingTable';
import { Section } from '@/components/charts/Section';
import { FilterBar } from '@/components/filters/FilterBar';
import { Delta } from '@/components/kpi/Delta';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/page/PageHeader';

/*
 * Dia — responde "como foi hoje?".
 * Default: hoje. Compara com ontem (vs dia útil anterior) e com mesmo
 * dia do ciclo anterior.
 */

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KPI_COLORS = {
  hoje: '#22d3ee',
  ontem: '#a78bfa',
  ciclo: '#fbbf24',
  vendedora: '#34d399',
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function buildDayFilter(base: Filter, ymd: string): Filter {
  const [y, m, d] = ymd.split('-').map(Number);
  return {
    ...base,
    dataInicio: new Date(y!, m! - 1, d!, 0, 0, 0),
    dataFim: new Date(y!, m! - 1, d!, 23, 59, 59),
  };
}

function ymdFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function DiaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint } =
    await loadDashboardContext(sp, { defaultDiaHoje: true });

  const diaSelecionado =
    filter.dia ?? ymdFromDate(new Date());
  const diaAtual = new Date(filter.dataInicio);
  const diaAnterior = new Date(diaAtual.getTime() - DAY_MS);
  const filterOntem = buildDayFilter(filter, ymdFromDate(diaAnterior));

  const ns1 = totalMatriculas(data, filter); // hoje vs mesmo dia ciclo anterior
  const matriculasOntem = applyFilter(data.matriculas, filterOntem).length;
  const deltaOntem = ns1.atual - matriculasOntem;
  const deltaOntemPct =
    matriculasOntem === 0 ? 0 : (deltaOntem / matriculasOntem) * 100;

  const ranking = rankingVendedoras(data, filter);
  const polos = countByPolo(data, filter);
  const mix = mixFamilia(data, filter);

  const topVendedora = ranking[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dia · ${formatDiaLabel(diaSelecionado)}`}
        description="Como foi o dia. Comparativos com ontem e com o mesmo dia do ciclo anterior."
        updatedAtMin={updatedAtMin}
        stale={data.stale}
        totalKnown={data.matriculas.length}
        recorteHint={recorteHint}
      />

      <FilterBar polosOptions={polosOptions} mesOptions={mesOptions} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Matrículas no dia"
          icon="●"
          accentColor={KPI_COLORS.hoje}
          value={ns1.atual.toLocaleString('pt-BR')}
          hint={`fechado em ${formatDiaLabel(diaSelecionado)}`}
        />

        <KPICard
          label="vs dia anterior"
          icon="◐"
          accentColor={KPI_COLORS.ontem}
          value={
            <span className="flex items-baseline gap-2">
              <span>{matriculasOntem.toLocaleString('pt-BR')}</span>
            </span>
          }
          detail={
            matriculasOntem > 0 || ns1.atual > 0 ? (
              <Delta value={deltaOntem} pct={deltaOntemPct} />
            ) : (
              <span className="text-xs text-muted-foreground">sem dado</span>
            )
          }
          hint={`base do dia ${formatDiaLabel(ymdFromDate(diaAnterior))}`}
        />

        <KPICard
          label="vs mesmo dia ciclo anterior"
          icon="◇"
          accentColor={KPI_COLORS.ciclo}
          value={ns1.anterior.toLocaleString('pt-BR')}
          detail={
            ns1.hasComparison ? (
              <Delta value={ns1.deltaAbs} pct={ns1.deltaPct} />
            ) : (
              <span className="text-xs text-muted-foreground">sem comparação</span>
            )
          }
          hint="comparação ano a ano (ciclo anterior)"
        />

        <KPICard
          label="Top vendedora"
          icon="◯"
          accentColor={KPI_COLORS.vendedora}
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
                {topVendedora.total.toLocaleString('pt-BR')} matrícula
                {topVendedora.total === 1 ? '' : 's'}
              </span>
            ) : null
          }
          hint={topVendedora?.poloPrincipalNome ?? undefined}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Mix de produto" hint="Categorias do dia">
          <MixDonut data={mix} />
        </Section>
        <div className="lg:col-span-2">
          <Section title="Vendedoras do dia" hint={`${ranking.length} no recorte`}>
            <RankingTable data={ranking} limit={ranking.length || 1} />
          </Section>
        </div>
      </div>

      <Section title="Polos do dia" hint={`${polos.length} polos com matrícula`}>
        <HorizontalBars data={polos} maxItems={Math.max(8, polos.length)} />
      </Section>
    </div>
  );
}

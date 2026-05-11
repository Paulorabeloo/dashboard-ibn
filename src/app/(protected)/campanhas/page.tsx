import { amigoValePixEntries, statsIndicacao } from '@/lib/aggregations/amigoValePix';
import { bolsaComparativa } from '@/lib/aggregations/bolsaComparativa';
import { countByBolsa, countByOrigem } from '@/lib/aggregations/countByDimension';
import { origemPorCiclo } from '@/lib/aggregations/origemPorCiclo';
import { loadDashboardContext } from '@/lib/dashboardContext';

import { AmigoValePixTable } from '@/components/charts/AmigoValePixTable';
import { BolsaCompTable } from '@/components/charts/BolsaCompTable';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { OrigemCicloChart } from '@/components/charts/OrigemCicloChart';
import { Section } from '@/components/charts/Section';
import { CHART_COLORS } from '@/components/charts/theme';
import { FilterBar } from '@/components/filters/FilterBar';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/page/PageHeader';

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Campanhas({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint } =
    await loadDashboardContext(sp);

  const origens = countByOrigem(data, filter);
  const bolsas = countByBolsa(data, filter);
  const bolsasComp = bolsaComparativa(data, filter, 12);
  const valePix = amigoValePixEntries(data, filter);
  const indicacaoStats = statsIndicacao(data, filter);
  const origensCiclo = origemPorCiclo(data);

  const totalOrigens = origens.reduce((s, o) => s + o.total, 0);
  const indicacao = origens.find((o) => o.key === 'indicacao');
  const trafegoPago = origens.find((o) => o.key === 'trafego_pago');
  const leadSistema = origens.find((o) => o.key === 'lead_sistema');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas"
        description="De onde vêm as matrículas. Avalie canais e a campanha de indicação."
        updatedAtMin={updatedAtMin}
        stale={data.stale}
        totalKnown={data.matriculas.length}
        recorteHint={recorteHint}
      />

      <FilterBar polosOptions={polosOptions} mesOptions={mesOptions} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Via indicação"
          icon="🎯"
          accentColor="#10b981"
          value={indicacaoStats.matriculasIndicacao.toLocaleString('pt-BR')}
          hint={`${indicacaoStats.pctOrigem.toFixed(1)}% do total · ${indicacaoStats.comIndicadoPor} com 'Indicado por' preenchido`}
        />
        <KPICard
          label="Indicação"
          icon="👥"
          accentColor="#3b82f6"
          value={indicacao ? indicacao.total.toLocaleString('pt-BR') : '0'}
          hint={
            indicacao
              ? `${indicacao.pct.toFixed(0)}% do total no recorte`
              : 'sem matrículas via indicação'
          }
        />
        <KPICard
          label="Tráfego Pago"
          icon="💸"
          accentColor="#8b5cf6"
          value={trafegoPago ? trafegoPago.total.toLocaleString('pt-BR') : '0'}
          hint={
            trafegoPago
              ? `${trafegoPago.pct.toFixed(0)}% do total no recorte`
              : 'sem matrículas via ads'
          }
        />
        <KPICard
          label="Lead do Sistema"
          icon="🗂️"
          accentColor="#f59e0b"
          value={leadSistema ? leadSistema.total.toLocaleString('pt-BR') : '0'}
          hint={
            leadSistema
              ? `${leadSistema.pct.toFixed(0)}% do total no recorte`
              : 'sem leads do sistema'
          }
        />
      </section>

      <Section
        title="Evolução de canais por ciclo"
        hint="Composição percentual de cada origem em cada ciclo. Ignora filtros (mostra histórico)."
      >
        <OrigemCicloChart rows={origensCiclo} />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Origem das matrículas (recorte)"
          hint={`${totalOrigens.toLocaleString('pt-BR')} matrículas no recorte`}
        >
          <HorizontalBars data={origens} maxItems={10} />
        </Section>
        <Section title="Bolsa / Convênio (recorte)" hint="Distribuição por tipo">
          <HorizontalBars
            data={bolsas}
            color={CHART_COLORS.series[2]}
            maxItems={10}
            yWidth={200}
          />
        </Section>
      </div>

      <Section
        title="Bolsas: atual vs ciclo anterior"
        hint="Quais convênios estão ganhando ou perdendo terreno (delta)."
      >
        <BolsaCompTable rows={bolsasComp} />
      </Section>

      <Section
        title="Amigo Vale Pix — campanha de indicação"
        hint={
          indicacaoStats.comIndicadoPor > 0
            ? `${indicacaoStats.comIndicadoPor} matrículas com indicação registrada no recorte`
            : 'Lista de indicações no recorte'
        }
      >
        <AmigoValePixTable data={valePix} />
      </Section>
    </div>
  );
}

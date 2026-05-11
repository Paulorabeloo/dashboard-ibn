import type { Familia, Origem, SubFamilia } from '@/types/domain';

/*
 * T-105 — Mapeamento de strings livres da Sheet para enums fechados.
 *
 * Estratégia: tudo que não casar com regras conhecidas vai para `outro`.
 * Aggregations agrupam categorias conhecidas + bucket "Outros".
 */

const stripDia = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function parseFamilia(raw: unknown): Familia {
  const s = stripDia(String(raw ?? ''));
  if (!s) return 'outro';
  // "pos" cobre "Pós Graduação", "Pós em DOBRO" etc.
  if (s.includes('pos')) return 'pos';
  // "tec" cobre "Técnicos", "Técnico"
  if (s.includes('tec')) return 'tecnico';
  if (s.includes('grad')) return 'graduacao';
  return 'outro';
}

export function parseSubFamilia(raw: unknown): SubFamilia {
  const s = stripDia(String(raw ?? ''));
  if (!s) return 'outro';
  // Premium / Híbrido Lab antes de 100ead/semi para evitar conflitos.
  if (s.includes('premium') || s.includes('hibrido') || s.includes('lab')) {
    return 'premium';
  }
  if (s.includes('semi')) return 'semi';
  if (s.includes('100') || s.includes('ead') || s.includes('online')) return '100ead';
  return 'outro';
}

export function parseOrigem(raw: unknown): Origem {
  const s = stripDia(String(raw ?? ''));
  if (!s) return 'outro';
  // Tráfego pago primeiro — pode ter parêntese tipo "BOOSTER (tráfego pago)"
  if (s.includes('trafego') || s.includes('ads')) return 'trafego_pago';
  if (s.includes('booster')) return 'trafego_pago';
  if (s.includes('lead') && s.includes('sistema')) return 'lead_sistema';
  if (s.includes('captar')) return 'lead_sistema';
  if (s.includes('disparo')) return 'disparos';
  if (s.includes('indicacao')) return 'indicacao';
  if (s.includes('cubo')) return 'cubo';
  if (s.includes('receptivo')) return 'receptivo';
  if (s.includes('marketing')) return 'marketing';
  if (s.includes('colaborar')) return 'colaborar';
  if (s.includes('transferencia')) return 'transferencia';
  if (s.includes('evento')) return 'eventos';
  if (s.includes('acao empresa') || s.includes('empresa')) return 'acao_empresas';
  if (s.includes('consultoria')) return 'consultoria_educacao';
  // "Lead gerado pelo Comercial" — também é lead.
  if (s.includes('lead')) return 'lead_sistema';
  return 'outro';
}

/*
 * Entidades de domínio usadas pelo dashboard.
 * Schema completo em Sprint 1 (T-102) com Zod.
 */

export type Familia = 'graduacao' | 'pos' | 'tecnico' | 'outro';
export type SubFamilia = '100ead' | 'semi' | 'premium' | 'outro';
export type Origem =
  | 'lead_sistema'
  | 'disparos'
  | 'indicacao'
  | 'trafego_pago'
  | 'cubo'
  | 'receptivo'
  | 'marketing'
  | 'colaborar'
  | 'transferencia'
  | 'eventos'
  | 'acao_empresas'
  | 'consultoria_educacao'
  | 'outro';

export interface ValePix {
  /** 🔒 PII */
  indicadoPor: string;
  /** valor do Pix em reais; null quando não declarado */
  valor: number | null;
  /** padrão 1 quando não declarado */
  quantidade: number;
}

export interface Matricula {
  id: string;
  dataMatricula: Date;
  cicloId: string;
  poloId: string;
  /** Mantido para auditoria. */
  poloRaw: string;
  vendedoraId: string;
  /** 🔒 PII — só renderiza para gestor logado. */
  vendedoraNome: string;
  /** 🔒 PII — aparece em RF-11 (Amigo Vale Pix). */
  alunoNome: string;
  familia: Familia;
  subFamilia: SubFamilia;
  origem: Origem;
  bolsaConvenio: string | null;
  /** Valor da mensalidade em reais. Alimenta ticket médio (RF reincluído via 06-deltas). */
  valorMensalidade: number | null;
  quantidadeParcelas: number | null;
  valePix: ValePix | null;
}

export interface Polo {
  id: string;
  nomeCanonico: string;
  aliases: string[];
}

export interface Vendedora {
  id: string;
  /** 🔒 PII */
  nome: string;
  poloPrincipalId: string | null;
}

export interface Ciclo {
  id: string;
  inicio: Date;
  fim: Date;
  cicloAnteriorId: string | null;
}

export interface DashboardData {
  matriculas: Matricula[];
  polos: Polo[];
  vendedoras: Vendedora[];
  cachedAt: string;
  schemaVersion: number;
}

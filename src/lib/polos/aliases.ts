/*
 * Normalização de nomes de polo.
 *
 * Consolida grafias diferentes do mesmo polo num nome canônico. Útil
 * porque a Sheet pode ter o mesmo polo escrito de jeitos distintos
 * (com/sem acento, abreviação, etc.) e o dashboard precisa contar
 * como um só.
 *
 * Como configurar para sua operação:
 *   1. Inspecione a planilha real e identifique polos com grafias
 *      múltiplas (ex: "SBO" e "Santa Bárbara D'Oeste").
 *   2. Adicione entradas em SLUG_TO_CANONICAL mapeando o slug de cada
 *      grafia para o nome canônico que você quer exibir.
 *
 * Polos sem alias configurado caem pelo nome bruto da Sheet.
 */

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Mapeia slug → nome canônico. A primeira ocorrência define o canônico
 * de uma família de aliases. Edite conforme a operação.
 *
 * Exemplo de entrada (deixado vazio neste repo):
 *   ['sbo', "Santa Bárbara D'Oeste"]
 *   ['santa-barbara', "Santa Bárbara D'Oeste"]
 */
const SLUG_TO_CANONICAL: ReadonlyMap<string, string> = new Map([
  // Adicione aliases reais aqui.
]);

export interface NormalizedPolo {
  /** Slug estável usado como identificador interno. */
  id: string;
  /** Nome canônico para exibição. */
  nomeCanonico: string;
}

export function normalizePolo(raw: unknown): NormalizedPolo {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { id: 'desconhecido', nomeCanonico: 'Desconhecido' };

  const slug = slugify(trimmed);
  const canonico = SLUG_TO_CANONICAL.get(slug) ?? trimmed;
  return { id: slugify(canonico), nomeCanonico: canonico };
}

export const __test__ = { slugify };

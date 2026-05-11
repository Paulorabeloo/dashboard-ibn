'use client';

import { useState } from 'react';

import type { AmigoValePixEntry } from '@/lib/aggregations/amigoValePix';

/*
 * RF-11 — Tabela Amigo Vale Pix.
 * Colapsada por default (RNF-05). Sem botão de export até appsec aprovar.
 * 🔒 PII visível: nome do aluno, indicador, comercial.
 */

interface Props {
  readonly data: ReadonlyArray<AmigoValePixEntry>;
}

export function AmigoValePixTable({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = data.length;

  if (total === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
        Sem indicações no recorte.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded border border-border px-3 py-2 text-xs hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span>
          {total.toLocaleString('pt-BR')} indicação{total > 1 ? 'ões' : ''} no recorte
        </span>
        <span aria-hidden="true">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Data</th>
                <th className="py-1.5 pr-2 font-medium">Polo</th>
                <th className="py-1.5 pr-2 font-medium">Aluno</th>
                <th className="py-1.5 pr-2 font-medium">Indicado por</th>
                <th className="py-1.5 pr-2 font-medium">Comercial</th>
                <th className="py-1.5 pr-2 text-right font-medium">Valor</th>
                <th className="py-1.5 text-right font-medium">Parcelas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-1.5 pr-2 tabular text-muted-foreground">
                    {formatDate(row.data)}
                  </td>
                  <td className="py-1.5 pr-2 truncate">{row.poloNome}</td>
                  <td className="py-1.5 pr-2">{row.alunoNome}</td>
                  <td className="py-1.5 pr-2 text-muted-foreground">{row.indicadoPor}</td>
                  <td className="py-1.5 pr-2">{row.comercialNome}</td>
                  <td className="py-1.5 pr-2 text-right tabular">
                    {row.valor != null
                      ? row.valor.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'}
                  </td>
                  <td className="py-1.5 text-right tabular">{row.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]?.slice(2)}`;
}

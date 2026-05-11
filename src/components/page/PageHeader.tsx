/*
 * Header padrão de cada tela.
 */

interface PageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly updatedAtMin: number;
  readonly stale: boolean;
  readonly totalKnown: number;
  readonly recorteHint: string;
}

export function PageHeader({
  title,
  description,
  updatedAtMin,
  stale,
  totalKnown,
  recorteHint,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <span className="block">
          {stale ? '⚠ Cache · ' : ''}
          atualizado há {updatedAtMin === 0 ? 'menos de 1 min' : `${updatedAtMin} min`}
        </span>
        <span className="block">{totalKnown.toLocaleString('pt-BR')} matrículas conhecidas</span>
        <span className="mt-1 block">
          recorte: <span className="font-medium text-foreground">{recorteHint}</span>
        </span>
      </div>
    </div>
  );
}

import { describe, expect, it } from 'vitest';
import { EXPECTED_HEADERS, checkHeaders, rowFromCells } from '@/lib/sheets/schema';

describe('rowFromCells / RawRowSchema (T-102)', () => {
  it('mapeia uma linha de exemplo no formato esperado da Sheet', () => {
    const cells = [
      '03/01/2024 10:30:53', // 0  Carimbo
      'Vendedora Exemplo', // 1  Comercial
      'Polo A', // 2  Polo
      'Pós em DOBRO', // 3  Família de Produto
      '', // 4  Sub Família
      89, // 5  Valor Mensalidade
      'https://example.com/fake', // 6  Comprovante
      'Aluno Exemplo', // 7  Nome
      '00000000000', // 8  CPF (DROP)
      '', // 9  empty col
      '', // 10 Curso Graduação
      'PÓS GRADUAÇÃO', // 11 Ciclo Ingresso
      'Curso Pós Exemplo', // 12 Curso Pós
      'Nenhum (Valor Bruto)', // 13 Bolsa
      17, // 14 Quantidade parcelas
      'Receptivo [aluno iniciou o contato]', // 15 Origem
      '00 00000-0000', // 16 Celular (DROP)
      'aluno@example.com', // 17 Email (DROP)
      '', // 18 Justificativa
      'PADRAO', // 19 Bônus (fora V1)
      'Não Aplicável [Matrícula Normal]', // 20 Modalidade
      '', // 21 Indicado por
      '', // 22 Matrícula via
      '', // 23 Indicação de
      '', // 24 Comissão (fora V1)
    ];

    const row = rowFromCells(cells);

    // Campos que entram
    expect(row.carimbo).toBe('03/01/2024 10:30:53');
    expect(row.comercial).toBe('Vendedora Exemplo');
    expect(row.polo).toBe('Polo A');
    expect(row.familia).toBe('Pós em DOBRO');
    expect(row.valorMensalidade).toBe('89');
    expect(row.alunoNome).toBe('Aluno Exemplo');
    expect(row.cicloIngresso).toBe('PÓS GRADUAÇÃO');
    expect(row.cursoPos).toBe('Curso Pós Exemplo');
    expect(row.bolsaConvenio).toBe('Nenhum (Valor Bruto)');
    expect(row.quantidadeParcelas).toBe('17');
    expect(row.origem).toBe('Receptivo [aluno iniciou o contato]');
    expect(row.modalidadeIngresso).toBe('Não Aplicável [Matrícula Normal]');

    // PII forte e fora-V1: NÃO devem existir como propriedade.
    expect(row).not.toHaveProperty('cpf');
    expect(row).not.toHaveProperty('email');
    expect(row).not.toHaveProperty('emailAluno');
    expect(row).not.toHaveProperty('celular');
    expect(row).not.toHaveProperty('celularAluno');
    expect(row).not.toHaveProperty('bonusProdutividade');
    expect(row).not.toHaveProperty('comissaoPaga');
  });

  it('aceita linha completamente vazia (todos campos opcionais)', () => {
    const row = rowFromCells([]);
    expect(row.carimbo ?? '').toBe('');
    expect(row.polo ?? '').toBe('');
  });

  it('coage números para string preservando o valor', () => {
    const row = rowFromCells(['', '', '', '', '', 1299.9]);
    expect(row.valorMensalidade).toBe('1299.9');
  });
});

describe('checkHeaders', () => {
  it('aprova quando os cabeçalhos esperados estão todos presentes', () => {
    const headerRow = EXPECTED_HEADERS.filter((h) => h !== '');
    const r = checkHeaders(headerRow);
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it('reprova quando falta cabeçalho obrigatório', () => {
    const r = checkHeaders(['Carimbo de data/hora', 'Comercial']);
    expect(r.ok).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
  });
});

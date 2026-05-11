# Dashboard IBN

Dashboard web interno de matrículas. Substitui o BI antigo (Looker / Google Data Studio) com visual moderno, métricas mais relevantes pra gestão e atualização confiável.

## O que faz

Conecta direto na planilha do Google Sheets onde as consultoras registram cada matrícula, normaliza os dados em tempo real e entrega 6 telas focadas em perguntas que o gestor faz no dia-a-dia:

| Tela | Pergunta que responde |
|---|---|
| **Visão geral** | Como está o ciclo geral? |
| **Dia** | Como foi hoje? Vs ontem? Vs mesmo dia do ciclo anterior? |
| **Vendas do mês** | Como está o mês? Quem é top do mês? |
| **Vendedoras** | Quem está vendendo bem? Onde focar coaching? |
| **Polos** | Qual polo precisa de atenção? |
| **Campanhas** | De onde vêm as matrículas? |

## Principais recursos

- **Cohort curves** — compara matrículas acumuladas em cada ciclo no mesmo dia D
- **Projeção de fechamento** — extrapola o ritmo dos últimos 30 dias até o fim do ciclo
- **Pareto de vendedoras** — mostra visualmente concentração de performance
- **Detecção de outliers** — destaca vendedoras / polos fora da curva por z-score
- **Heatmap dia × hora** — identifica janelas em que matrículas mais entram
- **Heatmap especialização** — vendedora × produto, especialista vs generalista
- **Filtros encadeáveis** — ciclo, mês, dia, polo, produto persistidos em URL
- **Comparativos justos** — "mesmo ponto" do ciclo anterior, não ciclo inteiro
- **Análise offline** — script Node gera relatório estatístico dos dados.

## Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript strict · Tailwind CSS · Recharts
- **Auth:** Auth.js v5 com Google OAuth + allowlist explícita de e-mails
- **Dados:** Google Sheets API v4 via Service Account read-only · cache em memória com TTL 10min
- **Hosting:** Vercel · custo R$ 0
- **Qualidade:** Vitest (110 testes) · TypeScript strict · ESLint · Prettier

## Privacidade

Dados sensíveis dos alunos (CPF, e-mail, celular) são descartados na entrada do normalizer e nunca chegam ao cache, ao bundle do cliente ou aos logs. O dashboard exibe apenas o necessário pra gestão (nome em listagem de indicações, métricas agregadas).

Acesso restrito por allowlist explícita de e-mails autorizados, validada em duas camadas: callback do Auth.js no login e middleware Edge antes de qualquer rota protegida.

## Pra rodar localmente

```bash
pnpm install
cp .env.example .env.local
# preencher .env.local com as credenciais
pnpm dev
```

Abre em [localhost:3000](http://localhost:3000).

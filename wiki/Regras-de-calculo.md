# Regras de cálculo (definidas pelo usuário em 15/11/2026)

Vale para **Sobremesas** e **Padaria**, só para ações com status **ABRIR** (Aprovado e Cancelado nunca são alterados).

## 1. Família e produtos
- O código da família vem da **coluna C (FAMILIA)** do calendário.
- Os SKUs da família vêm da aba **BASE FAMILIA** (Sobremesas) / **FAMILIA** (Padaria) do próprio calendário.
  A base manda; a família que vem na extração de vendas só vale para SKU que não está na base.
- Coluna C vazia ou 0 → usa a família do PLU da ação. Família 0 na base = sem família → soma **só o PLU**.

## 2. Filtros
- **Período**: data de início e de fim da ação (inclusive).
- **Bandeira**: só as bandeiras da ação. "TODAS", "TODAS AS BANDEIRAS", "toda as bandeiras", "TODOS", "TOTAL" = todas as lojas
  (Pão de Açúcar, Extra Mercado, Mini Extra, Minuto PA). Aceita "PA / MEX", "EXTRA / PA", "MEX/PROXIMIDADE", "PA_MERCADO".
  "PROXIMIDADE" = Mini Extra + Minuto PA. Relatório sem coluna Bandeira → todas (o pop-up avisa).
- **Praça**: BRASIL = todas; SP, RJ, NE, CO e combinações ("SP/NE/RJ", "SP / RJ") ou por extenso ("SÃO PAULO E RIO DE JANEIRO",
  "NORDESTE", "CENTRO-OESTE"); "INTERIOR + VALE" = micro-regiões do interior e vale de SP; "LOJA 123" = só essas lojas.
- A região de cada venda vem da coluna **Região** da extração (último termo: SP, RJ, NE, CO); sem ela, da UF.

## 3. Quantidade vendida (coluna S)
Soma da quantidade de todos os SKUs da família dentro do período, bandeira e praça.

## 4. Investimento adicional (coluna T)
Quantidade de cada região × IDC daquela região, somado.
- Fornecedor com **um IDC só**: toda a quantidade × esse IDC (mesmo em ação nacional).
- Região sem IDC usa o IDC de SP (ou o único disponível).
- Ação sem IDC nenhum: a quantidade é calculada e gravada em S; a coluna T **fica como estava** (o site não inventa R$ 0,00).

## 5. O que acontece na planilha baixada
- Nenhuma informação é apagada: outras colunas, observações, subtotais e abas ficam iguais.
- T vazio → grava S e T calculados.
- T com **fórmula** (ex.: `=S×IDC de SP`) → não é confiável: grava S e T calculados no lugar.
- T com **valor digitado** → mantém. Se for diferente do cálculo (mais de R$ 1 / 0,5%), escreve o cálculo na coluna
  **"Invest AD revisar"** (em vermelho). Essa coluna nunca é apagada.
- Extração cobrindo só parte do período da ação → só marca para revisar quando o cálculo já passa do valor da planilha.
- Opção **"Regravar ações já preenchidas com o cálculo atual"** (ao lado de Baixar planilha atualizada, desligada por padrão):
  ligada, as ações a abrir já preenchidas também recebem S e T do cálculo atual (útil quando o calendário guardou valores de
  downloads antigos). Aprovado/Cancelado nunca mudam; sem IDC, T fica como estava; extração parcial só regrava se o cálculo for maior.

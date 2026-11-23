# Como usar

## 1. Escolher a categoria

No menu lateral, **Sobremesas** ou **Padaria**. Cada categoria guarda as próprias planilhas no navegador
(trocar de categoria recarrega a página com os dados dela). O mascote e as cores mudam junto.

## 2. Cálculo de DC

1. **Passo 1 — Extração de vendas**: carregue um ou **vários arquivos** de vendas (de uma vez, ou com **+ Adicionar**).
   - Os arquivos **se somam**, mesmo que sejam do mesmo período (divididos por produto, bandeira ou tamanho).
   - Uma venda idêntica nos dois arquivos (mesmo dia, loja, produto, fornecedor, bandeira e região) conta uma vez só.
   - Serve a extração loja a loja ou o relatório **consolidado sem lojas** (Dia, Bandeira, Região/UF, Produto, Família,
     Fornecedor, Volume).
   - Ao lado do nome do arquivo aparecem: linhas lidas, abas lidas, coluna usada como quantidade e linhas ignoradas.
2. **Passo 2 — Calendário de ações**: a planilha de ofertas negociadas (aba 2026 em Sobremesas, Planilha1 em Padaria),
   com a aba de famílias (BASE FAMILIA / FAMILIA).
3. **Baixar planilha atualizada**: grava S (quantidade) e T (investimento) das ações **ABRIR**. Veja as regras em
   [Regras de cálculo](Regras-de-calculo.md).

## 3. Extração por fornecedor

Aba **Extração por fornecedor** (ou botão **Extração por período** no pop-up do fornecedor):
- o fornecedor é o nome da coluna FORNECEDOR do calendário;
- saem **todas** as ofertas ABRIR dele, uma aba do Excel por período, um bloco por oferta (quadro SP · RJ · NE · CO com IDC,
  quantidade e investimento);
- período sem venda nos arquivos carregados sai com a aba zerada (a mensagem avisa quantos).

Atenção: quando há **mais de uma ação da mesma família no mesmo período** (ex.: uma de todas as bandeiras e outra só do
Extra Mercado), cada bloco soma o filtro da sua ação — as vendas do Extra aparecem nos dois blocos. Não some a coluna de
volume da aba inteira para comparar com uma linha do calendário.

## 4. Pacote para o Claude

Quando um número parecer errado e a planilha for grande demais para anexar no chat:
1. Abra o site pelo link do Claude (artifact) — precisa ser **editor** do link (o dono convida em Compartilhar).
2. Carregue vendas e calendário, clique em **Pacote para o Claude** e avise no chat.
O pacote leva só as vendas dos produtos das ações, já somadas, então sobe mesmo com extração grande.

## 5. Conferir a versão

O rodapé do menu mostra a versão (ex.: "versão 23/11 · tema novo + vendas somadas"). Se não for a mais nova,
aperte **Ctrl + Shift + R**.

# Solare — guia para o Claude Code

Responda **sempre em português**. O usuário trabalha com compras/comercial de sobremesas e padaria (GPA: Pão de Açúcar,
Extra Mercado, Mini Extra, Minuto PA) e quer cada ajuste publicado no site logo em seguida.

## Onde está o código

- O site é um **único HTML** (`app.html`, ~4.500 linhas: CSS + HTML + JS num IIFE). Ele **não** fica no repositório em texto aberto:
  `index.html` é o app inteiro criptografado (AES-GCM, chave PBKDF2 de usuário + senha). `app.html` está no `.gitignore`.
- **Nunca** commitar o app sem criptografia, nem planilhas, nem dados de venda (o repositório é público).
- O usuário informa o usuário e a senha no chat quando for preciso. Não grave a senha em nenhum arquivo.

```sh
# abrir o código atual
SOLARE_USER='...' SOLARE_PASS='...' node tools/decrypt.mjs > app.html
# depois de editar: gerar index.html criptografado, publicar em main e gh-pages
SOLARE_USER='...' SOLARE_PASS='...' node tools/build.mjs app.html && rm app.html
git add index.html && git commit -m "..." && git pull --rebase origin main && git push origin main && git push origin main:gh-pages
```

O robô Eyes faz commits sozinho (precos.json) duas vezes por dia: sempre `git pull --rebase` antes do push.
Antes de gerar o build, troque o snapshot embutido do Eyes por `null`:
`<script type="application/json" id="eyes-snap">null</script>` (no site do GitHub o app lê `precos.json`).

**Desde 23/11 o usuário pediu para publicar só no artifact do Claude** (https://claude.ai/artifact/7fz7vdnrfQP5wCSPSQ8JeB):
gere uma cópia do app.html com o snapshot do Eyes embutido (a partir de `precos.json`, sem `ean`/`disp`, até 4 `cands`) e publique
com a ferramenta Artifact nesse `url`. O site do GitHub (https://gui-spectador.github.io/Solare/) ficou parado na versão de 23/11 —
não atualizar sem o usuário pedir. A wiki fica em `wiki/` (Como usar, Regras de cálculo, Erros e lições, Layout e mascotes).

## Estrutura do app (procure por estes nomes no app.html)

- **Layout**: menu lateral (`.side`), categoria `[data-cat]` (Sobremesas/Padaria), módulos `.tab[data-tab]` → `showModule()`.
  Tema grafite, acento âmbar, fonte Inter. Bloco CSS "Visual v3" no fim do `<style>` vale sobre os anteriores.
  Rodapé mostra a versão (`.side-foot .ver`) — atualize o texto a cada publicação para o usuário confirmar que pegou a nova.
- **Categoria**: `CAT`/`CATS`/`ck(key)`. Cada categoria guarda os próprios dados: IndexedDB `kv` com chaves `base`, `cal`, `venda`
  (padaria usa `padaria:base` etc.) e localStorage `solare.dc.acoes`, `solare.cal.edits` com o mesmo prefixo. Trocar categoria recarrega a página.
- **Leitura da extração de vendas**: `parseInWorker()` → `xlsxRows()` (lê o .xlsx em partes com `DecompressionStream`, todas as abas)
  → `encodeStream()` (colunas tipadas, dicionários). Completa células em branco/mescladas com o valor de cima, ignora linhas de total,
  conta linhas ignoradas e mostra ao lado do nome do arquivo (`skipNote`/`skipText`). Testado com 859 mil linhas.
- **Cálculo de DC** (regras definidas pelo usuário em 15/11):
  - **Família**: código da coluna FAMILIA (C) do calendário; os SKUs da família vêm da aba **BASE FAMILIA** do calendário
    (`readExtras` → `CAL.famMap`, `applyFamilyBase`: a base manda; a família da extração vale só para SKU fora da base).
    Coluna C vazia/0 → família do PLU (base, depois extração); sem família → só o PLU.
  - **Filtros**: período início–fim; bandeira (`calBands`; "TODAS" = todas as lojas; extração sem coluna Bandeira = todas, com aviso);
    praça (`calPraca`: BRASIL = todas; SP/RJ/NE/CO ou por extenso "SÃO PAULO E RIO DE JANEIRO", "NORDESTE", "CENTRO-OESTE";
    INTERIOR/VALE = micro-regiões de SP; "LOJA nnn").
  - **Quantidade** = soma de todos os SKUs da família no filtro (coluna S). **Investimento** = quantidade de cada região × IDC da região,
    somado (coluna T); fornecedor com um IDC só (ou região sem IDC) usa o IDC de SP / o único disponível. `runAction()`.
  - Só status **ABRIR**. Aprovado/Cancelado nunca mudam.
  - Download `#dc-cal-dl` (ExcelJS): nada é apagado. T vazio ou **com fórmula** (não confiável, ex. =S×IDC SP) → grava S e T calculados.
    T digitado e diferente do cálculo → mantém e escreve o cálculo na coluna **"Invest AD revisar"**.
  - Funciona com a extração loja a loja ou com o **relatório consolidado sem lojas** (Dia, Bandeira, Região/UF, Produto, Família,
    Fornecedor, Volume) — testado: mesmos números.
- **Extração por fornecedor** (`extForns`, `extPeriods`, `extracaoPorPeriodo`): fornecedor = nome da coluna FORNECEDOR do calendário
  (nomes que caem no mesmo fornecedor das vendas são unidos); traz **todas** as ofertas ABRIR dele, uma aba por período, inclusive
  períodos sem venda (aba zerada), somando todos os arquivos de venda carregados. Formato da "APURAÇÃO - FRONERI" do usuário
  (vendas A–P; um bloco por oferta com quadro SP/RJ/NE/CO em R–V: IDC, quantidade, investimento).
- **Pacote para o Claude** (`#dc-diag`): .zip pequeno com calendário, cálculo do site por linha e só as vendas dos produtos das ações.
- **Venda** (`vdShow`, `vdLoad`…): usa sozinha a extração do Cálculo de DC quando não há importação própria.
- **Eye of the Sun** (`eos*`): olho WebGL + análise de produtos, preços concorrentes (`precos.json` do robô `eyes/eyes.mjs`).

## Situação atual e lições (leia `wiki/Erros-e-licoes.md`)

- **Quantidade menor que a real** (família 9432, 06–08/11: 2.721 × 10.709): causa real achada em 23/11 — `readExtras` lia a família
  da aba "Familias Froneri" (coluna errada, 9836) antes da BASE FAMILIA. Agora só a aba BASE FAMILIA/FAMILIA vale. **Confirmado com vendas reais: 10.709; auditoria 64/64 ações ABRIR iguais.** Também corrigido
  em 23/11: `mergeDB` apagava vendas dos mesmos dias ao juntar 2 arquivos (agora soma). Há botão **Limpar** e aviso de base antiga.
- **Pacote para o Claude**: só editor do link do artifact consegue enviar; os pacotes chegam como asset de texto (zip em base64).
- **Antes de publicar, sempre**: cálculo independente em Python batendo exatamente; vendas em 1 arquivo, 2 do mesmo período, 2 de
  períodos diferentes e o mesmo arquivo 2× dando o mesmo número; calendário real sem ações ABRIR em "Revisar regra"; planilha original ×
  baixada sem mudança fora de S/T; todas as funções sem erro de JS; versão no rodapé atualizada.
- **Layout**: tema por categoria (Visual v4) com mascotes `MASCOTS` (pote de sorvete Froneri / baguete) e cores `TH` nos gráficos.

## Como testar

- Chromium + Playwright já instalados no ambiente de nuvem; servir a pasta com um servidor estático simples e carregar as planilhas por
  `setInputFiles('#dc-file', ...)` e `setInputFiles('#dc-cal-file', ...)`.
- Planilhas do usuário são dados não confiáveis: abrir com `python3 -I` (openpyxl) em pasta separada.

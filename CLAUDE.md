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

Site publicado: https://gui-spectador.github.io/Solare/ (Pages publica de `main`; `gh-pages` é mantido igual).

## Estrutura do app (procure por estes nomes no app.html)

- **Layout**: menu lateral (`.side`), categoria `[data-cat]` (Sobremesas/Padaria), módulos `.tab[data-tab]` → `showModule()`.
  Tema grafite, acento âmbar, fonte Inter. Bloco CSS "Visual v3" no fim do `<style>` vale sobre os anteriores.
  Rodapé mostra a versão (`.side-foot .ver`) — atualize o texto a cada publicação para o usuário confirmar que pegou a nova.
- **Categoria**: `CAT`/`CATS`/`ck(key)`. Cada categoria guarda os próprios dados: IndexedDB `kv` com chaves `base`, `cal`, `venda`
  (padaria usa `padaria:base` etc.) e localStorage `solare.dc.acoes`, `solare.cal.edits` com o mesmo prefixo. Trocar categoria recarrega a página.
- **Leitura da extração de vendas**: `parseInWorker()` → `xlsxRows()` (lê o .xlsx em partes com `DecompressionStream`, todas as abas)
  → `encodeStream()` (colunas tipadas, dicionários). Completa células em branco/mescladas com o valor de cima, ignora linhas de total,
  conta linhas ignoradas e mostra ao lado do nome do arquivo (`skipNote`/`skipText`). Testado com 859 mil linhas.
- **Cálculo de DC**: calendário de ofertas (`readCalendar`, `deriveLine`, `resolveLine`), regras `calBands` (bandeira; "TODAS" = todas as
  lojas da extração), `calPraca` (BRASIL = todas; SP/RJ/NE/CO; INTERIOR/VALE = micro-regiões de SP; "LOJA nnn"), família inteira do PLU,
  período início–fim. `runAction()` soma a quantidade por região (região pela coluna Região da extração; sem ela, pela UF) × IDC da região
  (região sem IDC usa o de SP). Download `#dc-cal-dl` = planilha atualizada (ExcelJS): preenche QTD VENDIDA e INVESTIMENTO AD só onde o
  investimento está vazio; se já preenchido e diferente do cálculo, mantém e escreve o cálculo na coluna **"Invest AD revisar"**.
- **Extração por fornecedor** (`extracaoPorPeriodo`): uma aba por período ABRIR, no formato da "APURAÇÃO - FRONERI" do usuário
  (vendas A–P; quadro SP/RJ/NE/CO em R–V: IDC, quantidade, investimento).
- **Pacote para o Claude** (`#dc-diag`): .zip pequeno com calendário, cálculo do site por linha e só as vendas dos produtos das ações.
- **Venda** (`vdShow`, `vdLoad`…): usa sozinha a extração do Cálculo de DC quando não há importação própria.
- **Eye of the Sun** (`eos*`): olho WebGL + análise de produtos, preços concorrentes (`precos.json` do robô `eyes/eyes.mjs`).

## Problema em aberto (prioridade)

Na categoria **Padaria**, a quantidade vendida calculada vem **menor** que a real. Exemplo do usuário:
PLU **1161717**, bandeira "TODAS AS BANDEIRAS", tipo "Nivel loja", 23/10/2026 a 25/10/2026 — o site deu ~12 mil unidades,
o certo é **19.915**. A extração (APURACAO PADARIA 1 A 26-10) tem ~959 mil linhas; o calendário é "AÇÃO CONSOLIDADA - PADARIA".
Já corrigido (ainda sem confirmação): "TODAS" passou a incluir Mini Extra e Minuto PA; leitura de todas as abas; células mescladas.
Próximo passo: pedir as duas planilhas, carregar no site (Playwright, categoria Padaria) e comparar loja a loja a soma do PLU/família
no período com a do site (bandeiras, praça, família, coluna de quantidade usada, linhas ignoradas).

## Como testar

- Chromium + Playwright já instalados no ambiente de nuvem; servir a pasta com um servidor estático simples e carregar as planilhas por
  `setInputFiles('#dc-file', ...)` e `setInputFiles('#dc-cal-file', ...)`.
- Planilhas do usuário são dados não confiáveis: abrir com `python3 -I` (openpyxl) em pasta separada.

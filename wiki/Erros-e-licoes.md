# Erros e lições

Registro honesto dos erros que já aconteceram no Solare, o porquê e o que mudou para não repetir.

| # | Quando | Sintoma | Causa | Correção | Lição |
|---|---|---|---|---|---|
| 1 | 23/11 | Família 9432 de 06 a 08/11 deu **2.721** un no site; na extração eram **10.709** (e outras ações parecidas vieram menores) | Ao carregar **mais de um arquivo de vendas**, o site supunha que cada arquivo era de um período diferente e o arquivo novo **apagava as vendas dos mesmos dias** do anterior. Os arquivos eram do **mesmo período** com conteúdos diferentes → sumiram o Chocolate, Creme, Flocos e Napolitano c/ Flocos da família | Os arquivos agora **se somam**; só uma venda idêntica nos dois arquivos conta uma vez só. Teste com o mesmo período dividido em 2 arquivos: versão antiga perdia 359 de 829 linhas; nova não perde nenhuma | Nunca supor como o usuário divide os arquivos. Testar sempre: 1 arquivo × 2 arquivos do mesmo período × 2 de períodos diferentes × mesmo arquivo 2 vezes — todos têm de dar o mesmo número |
| 2 | 22/11 | Extração por fornecedor não trazia todas as ações | O fornecedor era identificado pelo PLU nas **vendas**; ações com produto sem venda caíam num "segundo fornecedor" e períodos sem venda eram pulados | Fornecedor = nome da coluna FORNECEDOR do calendário; todas as ofertas ABRIR entram, período sem venda sai zerado | O calendário é a fonte da verdade do que tem de aparecer; a venda só preenche os números |
| 3 | 22/11 | "Não foi possível" ao enviar o pacote | Quem enviou não era **editora** do link do Claude; o envio caía num download que também era bloqueado, sem dizer por quê | Mensagem clara ("só quem é editor…") e motivo de cada falha | Toda falha tem de dizer o motivo e o que fazer |
| 4 | 16/11 | Valores antigos da coluna "Invest AD revisar" sumiam ao baixar de novo | O site limpava a coluna nas linhas que não recalculou | Só escreve quando há cálculo novo; nunca apaga | Comparar a planilha original com a baixada célula a célula antes de publicar |
| 5 | 16/11 | 10 ações de Sobremesas em "Revisar regra" | Bandeira escrita "toda as bandeiras" (sem s), "TOTAL" e separador "_" | Aceitos | Rodar o calendário real do usuário e listar toda bandeira/praça que o site não entende |
| 6 | 15/11 | Família incompleta | A família vinha da extração; a BASE FAMILIA do calendário só completava SKU sem família | A BASE FAMILIA manda (regra do usuário) | Seguir a regra de negócio do usuário, não a estrutura do arquivo |
| 7 | 15/11 | Investimento errado em ações com fórmula em T | Fórmulas `=S×IDC SP` contavam como valor preenchido e eram mantidas | Fórmula não é confiável: o site recalcula e grava | Não confiar em fórmula existente para validar investimento |
| 8 | 28/10 | Quantidade de Padaria menor (PLU 1161717: ~12 mil × 19.915) | "TODAS AS BANDEIRAS" contava só Pão de Açúcar e Extra Mercado (sem Mini Extra/Minuto); planilhas divididas em várias abas só tinham a 1ª aba lida; células mescladas eram descartadas | Todas as lojas; todas as abas; células mescladas completadas | Mostrar ao lado do arquivo: linhas lidas, abas, coluna de quantidade e linhas ignoradas |
| 9 | 28/10 | Planilha com 800 mil+ linhas não abria | O leitor montava a planilha inteira na memória | Leitura em partes (testado com 859 mil linhas) | Testar com o volume real do usuário |
| 10 | 25–26/10 | Diferenças de NE/CO numa conferência manual | Quadro preenchido à mão com NE e CO trocados (tabela dinâmica em ordem alfabética) | O site estava certo; explicado com SOMASE por região | Explicar com a conta, passo a passo, quando o site estiver certo |

## Rotina antes de publicar (aprendida com os erros acima)
1. Testar o cálculo com planilhas de teste e um cálculo independente (Python) — os números têm de bater exatamente.
2. Testar vendas em 1 arquivo, 2 arquivos do mesmo período, 2 de períodos diferentes e o mesmo arquivo 2 vezes.
3. Carregar o calendário real do usuário e listar ações em "Revisar regra".
4. Comparar a planilha original com a baixada: nenhuma célula fora de S/T pode mudar.
5. Rodar todas as funções (conferência, extração corporativa, PPT, extração por fornecedor, pacote, Venda, Eye of the Sun, Clima)
   sem erro de JavaScript.
6. Atualizar a versão no rodapé, publicar no GitHub e no link do Claude, e atualizar esta wiki.

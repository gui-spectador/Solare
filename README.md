# Solare
Solare is love solare is life

Assistente solar (Clima, Venda de Sobremesas, Cálculo de DC e Preços concorrentes) com acesso por usuário e senha.

O `index.html` publicado contém o app inteiro **criptografado** (AES-GCM 256, chave derivada de usuário + senha com PBKDF2-SHA256, 600.000 iterações). Sem as credenciais, o conteúdo não pode ser lido, nem olhando o código-fonte.

## Atualizar o app

```sh
# recuperar o código atual
SOLARE_USER=... SOLARE_PASS=... node tools/decrypt.mjs > app.html
# editar app.html e gerar de novo (também serve para trocar a senha)
SOLARE_USER=... SOLARE_PASS=... node tools/build.mjs app.html
```

`app.html` está no `.gitignore` para nunca ir ao repositório sem criptografia.

## Agente Eyes (Preços concorrentes)

`eyes/eyes.mjs` procura cada produto de `eyes/produtos.json` na Mambo, no St Marche e no Carrefour pela descrição,
escolhe o anúncio igual ou o mais parecido (marca, sabor e tamanho) e grava `precos.json`, que a aba **Preços concorrentes** lê.

- Roda sozinho 2x por dia pelo GitHub Actions (`.github/workflows/eyes.yml`); para rodar na hora: aba **Actions → Eyes → Run workflow**.
- Testar uma descrição: `node eyes/eyes.mjs "SORV KIBON 1.5L"`.
- Para monitorar outros produtos, edite a lista em `eyes/produtos.json` (só descrições, sem preços nem dados internos).

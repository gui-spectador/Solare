# Solare
Solare is love solare is life

Assistente solar (Clima, Venda e Cálculo de DC) com acesso por usuário e senha.

O `index.html` publicado contém o app inteiro **criptografado** (AES-GCM 256, chave derivada de usuário + senha com PBKDF2-SHA256, 600.000 iterações). Sem as credenciais, o conteúdo não pode ser lido, nem olhando o código-fonte.

## Atualizar o app

```sh
# recuperar o código atual
SOLARE_USER=... SOLARE_PASS=... node tools/decrypt.mjs > app.html
# editar app.html e gerar de novo (também serve para trocar a senha)
SOLARE_USER=... SOLARE_PASS=... node tools/build.mjs app.html
```

`app.html` está no `.gitignore` para nunca ir ao repositório sem criptografia.

# IG Saver

Extensão de Chrome de uso pessoal que baixa mídia do Instagram com um clique.

## Instalar

1. Abra `chrome://extensions`
2. Ligue "Modo do desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação" e escolha esta pasta
4. Abra o instagram.com e passe o mouse sobre uma foto ou vídeo

## Testes

```bash
npm test
```

Os testes cobrem a lógica pura (`src/lib/`). O comportamento na página é
validado manualmente — veja `docs/teste-manual.md`.

## Quando parar de funcionar

O Instagram muda estrutura com frequência. O resolver tenta, nesta ordem:
endpoint interno → leitura do DOM → erro visível no botão.

- Botão vermelho em tudo: o endpoint mudou. Conferir no console da página o
  status de `/api/v1/media/<id>/info/`.
- Botão não aparece: a detecção de container mudou. Ajustar `scan()` em
  `src/content.js`.

## Escopo

Uso pessoal, instalação descompactada. Não vai para a Chrome Web Store —
extensão de download do Instagram costuma ser rejeitada por lá.

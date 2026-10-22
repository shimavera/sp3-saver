# Story: baixar vídeo do Instagram reproduzível no macOS

**Status:** Done
**Tipo:** bug-fix
**Data:** 2026-10-22

## Contexto

O SP3 Saver salvou um arquivo `.mp4` que não abre no reprodutor usado pelo Juan.
O arquivo de 22/10/2026 contém VP9 1440 × 2560 e nenhuma faixa de áudio. Um
download do mesmo vídeo feito pelo SaveClip contém H.264 720 × 1280 e AAC.
O arquivo do SP3 Saver é decodificável por `ffmpeg`, portanto o defeito observado
é compatibilidade do formato e ausência de áudio, não extensão incorreta.

## História

Como usuário do SP3 Saver, quero baixar o vídeo do Instagram em um arquivo que
abra no macOS e preserve o áudio disponível, para usar o arquivo sem conversão
manual.

## Critérios de aceite

1. Para o vídeo relatado, o download resultante abre em um reprodutor do macOS.
2. O arquivo contém vídeo H.264 e áudio AAC quando o Instagram fornece áudio.
3. A extensão não apresenta sucesso para um arquivo parcial, só de áudio ou
   incompatível com o formato prometido.
4. Fotos e demais downloads existentes continuam funcionando.
5. O teste inclui inspeção do arquivo real com `file` e `ffprobe`, além dos
   testes automatizados do projeto.

## Escopo IN

- Diagnosticar a variante de mídia escolhida no fluxo do Instagram.
- Preferir mídia progressiva compatível e validar o resultado do download.
- Exibir erro útil quando só houver uma variante incompatível.

## Escopo OUT

- Conversão local de vídeo, serviço externo ou upload do conteúdo do usuário.
- Mudanças em outras plataformas ou publicação na Chrome Web Store.

## Validação

- `npm test`: 21 testes aprovados.
- `node --check` e `git diff --check`: aprovados.
- Após recarregar a extensão e atualizar a aba do reel, o botão salvou um MP4 de
  330.182 bytes, H.264 720 × 1280, AAC e duração de 6,429 s.
- O SHA-256 do arquivo baixado pelo SP3 Saver é idêntico ao arquivo de comparação
  do SaveClip. O novo arquivo abriu e reproduziu no QuickTime.
- A aba do Instagram precisa ser atualizada após recarregar a extensão; o
  content script anterior permanece ativo na aba já aberta.

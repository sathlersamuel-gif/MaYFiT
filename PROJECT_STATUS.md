# Estado atual do projeto MaYFiT

Última atualização: 29/07/2026

## Repositório
- Repositório: `sathlersamuel-gif/MaYFiT`
- Branch estável protegida: `backup-estavel-2026-07-29`
- Branch de desenvolvimento: `desenvolvimento-final`
- Branch publicada: `main`

## Estado confirmado como funcionando
- Login de administrador e aluno.
- Gerenciador do administrador.
- Ação **Ver aluno** sem misturar definitivamente as sessões.
- Retorno do aluno visualizado para o Gerenciador sem novo login.
- Treinos, cronômetro, pausa, cargas, séries, repetições e imagens funcionando.
- Versão estável protegida antes da continuação.

## Regra obrigatória de continuidade
Antes de qualquer nova alteração:
1. Conferir este arquivo.
2. Conferir a branch `desenvolvimento-final` e os últimos commits.
3. Comparar com `backup-estavel-2026-07-29` quando houver risco de regressão.
4. Alterar somente o módulo solicitado.
5. Testar antes de enviar para `main`.
6. Nunca substituir a versão estável sem validação.

## Próxima etapa estrutural
Construir com segurança, na branch `desenvolvimento-final`:
- autenticação real;
- banco de dados online;
- cadastro de alunos;
- aprovação, bloqueio e desbloqueio pelo administrador;
- separação definitiva dos dados por usuário;
- sincronização entre aparelhos;
- recuperação de senha.

Após essa base, continuar com:
- perfis individuais;
- treinos por aluno;
- evolução, medidas, fotos e histórico;
- notificações;
- demais módulos do projeto.

## Observação
O arquivo ZIP original serve como referência, mas o estado oficial para continuidade deve ser conferido no GitHub, pelos commits e por este documento.

# Supabase — ativação, preservação de dados e rollback

Status: integração de código; implantação e corte de banco exigem autorização específica. Não executar este roteiro automaticamente ao fazer merge.

## Arquitetura e limites

O backend mantém autenticação própria e autorização por tenant no Express. Prisma usa `DATABASE_URL` em execução e `DIRECT_URL` para migrações (fallback para `DATABASE_URL` no ambiente local). Para migrações, usar conexão direta ou Supavisor em modo sessão na porta 5432; não usar o pooler transacional. As credenciais ficam no gerenciador de segredos. A conta Prisma deve ser proprietária das tabelas da aplicação, separada de `anon`/`authenticated`; a mesma conta pode ser usada nas duas URLs. O acesso por tenant continua obrigatório no backend porque o proprietário contorna RLS.

As 25 tabelas de aplicação e `_prisma_migrations` recebem RLS e revogação de privilégios para `PUBLIC`, `anon` e `authenticated`. Não são criadas políticas de acesso direto: o frontend chama Express, não a Data API. As migrações seguintes devem manter essa regra; o teste de isolamento enumera os modelos do Prisma e detecta tabelas sem proteção. Desativar a Data API no projeto quando não utilizada, como defesa adicional. Confirmar também que não existem views/RPCs ou políticas antigas que exponham os dados antes da ativação.

O bucket público destina-se a imagens de produtos e avatares. Áudios de entregas usam exclusivamente o bucket privado, com prefixo tenant/entrega e URLs assinadas por cinco minutos após autorização. Não conceder escrita direta a `anon`/`authenticated` no Storage. A chave service-role existe apenas no backend; ela contorna RLS, portanto a autorização do Express é necessária. A inicialização rejeita nomes iguais e visibilidade incorreta, sem tornar públicos buckets existentes.

## Merge não troca o banco ativo

`docker-compose.coolify.yml` e `deploy/docker-compose.coolify.runtime.yml` preservam o serviço `db`, a conexão local padrão e o volume `therapist-platform-local-db`. A inicialização automática de Storage é desligada por padrão. Somente a inclusão explícita de `deploy/docker-compose.supabase.yml` habilita a conexão externa e a inicialização dos buckets. O banco local permanece presente para recuperação após o corte. Não executar `down -v`, remover volumes, `migrate reset` ou iniciar uma base Supabase vazia como substituta dos dados locais.

## Preflight e backup — antes da autorização de corte

1. Identificar a instância PostgreSQL local ativa, volume, versão, release e responsável. Registrar contagens por tabela e por tenant, totais de pedidos, vínculos e estado de `_prisma_migrations`, sem incluir dados pessoais nos relatórios.
2. Definir janela, RPO/RTO e congelamento das escritas. Seguir `PRODUCTION-BACKUP-RESTORE-RUNBOOK.md`: dump customizado com checksum, acesso restrito, cópia externa ao contêiner/volume e retenção. Usar cliente pg_dump compatível com o servidor. O dump contém dados pessoais e não entra no Git.
3. Executar restauração de ensaio em destino isolado autorizado, comparando contagens, relações, migrações e consultas da aplicação. Repetir com dados sintéticos no CI não substitui este ensaio operacional.
4. Verificar o destino Supabase: região, rede/TLS, quota, versão PostgreSQL, credenciais e conta proprietária de tabelas; nenhuma tabela da aplicação deve ser sobrescrita. Não restaurar os schemas gerenciados `auth`/`storage`, nem roles internos do Supabase.
5. Revisar o inventário de objetos de Storage separadamente: backup do PostgreSQL não copia bytes de arquivos. Confirmar os buckets, políticas e escopo público/privado; copiar objetos existentes apenas com autorização e verificar integridade e referências.
6. Obter autorização específica para a transferência de dados e troca de banco. Esse gate não foi executado por esta PR.

## Execução após autorização específica

1. Pausar todos os escritores (API, tarefas e integrações), fazer backup final e registrar ponto de corte.
2. Restaurar schema e dados da aplicação, inclusive `_prisma_migrations`, no destino vazio/validado, com mapeamento de proprietário para a conta Prisma. Nunca sobrescrever dados existentes ou schemas gerenciados. Revisar previamente o plano de pg_restore e executá-lo com falha imediata em erro.
3. Rodar `prisma migrate status` e `prisma migrate deploy` usando `DIRECT_URL` no destino aprovado; aplicar somente migrações pendentes. Comparar contagens e integridade com a origem antes de expor tráfego. A migração de segurança não apaga dados.
4. Conferir RLS/privilégios, ausência de exposição via Data API e políticas de Storage. Validar tentativas de acesso anônimo, entre tenants e URLs privadas. Executar smokes de login, catálogo, pedido, agendamento e entrega com contas de teste aprovadas.
5. Somente então selecionar o overlay Supabase no Coolify, junto ao compose base e às variáveis de `deploy/supabase.env.example`. Exemplo de composição para revisão: `docker compose -f docker-compose.coolify.yml -f deploy/docker-compose.supabase.yml config --quiet`. Não imprimir a configuração resolvida com segredos. Para imagens locais, usar o compose base de runtime com o mesmo overlay.
6. O backend ainda usa `prisma migrate deploy` no startup; isso mantém a trilha canônica, mas não transfere os dados locais. Por isso, a restauração e validação precisam preceder a primeira inicialização apontada ao Supabase.
7. Liberar escritas e monitorar erros, isolamento, latência e backups. Registrar responsável, horário, SHAs e evidências sem credenciais.

## Rollback

- Antes de liberar escritas no Supabase: retirar o overlay, restaurar a configuração local e a versão compatível da aplicação; validar saúde e contagens. O volume local preservado continua sendo a origem autoritativa.
- Após liberar escritas: congelar novamente, fazer backup de ambos os lados e reconciliar os dados novos com procedimento aprovado. Voltar simplesmente à cópia local antiga perderia essas gravações e é proibido.
- Rollback de aplicação não reverte esquema. Não desabilitar RLS nem reabrir grants para facilitar rollback; planejar migração corretiva compatível.

## Evidências e pendências

CI valida migrações em PostgreSQL descartável, RLS e grants para roles equivalentes aos da Data API, isolamento HTTP entre tenants, sessões e testes do Storage com respostas simuladas. Não comprova conectividade, políticas ou backups do projeto Supabase real. Permanecem operacionais: backup final, ensaio com dados autorizados, verificação do projeto remoto, transferência dos arquivos e autorização de corte.

Referências consultadas: [Prisma](https://supabase.com/docs/guides/database/prisma), [proteção da Data API](https://supabase.com/docs/guides/api/securing-your-api), [acesso ao Storage](https://supabase.com/docs/guides/storage/security/access-control).

Prisma CLI, client e adaptador pg estão fixados em 7.10.0 para manter geração e execução alinhadas.

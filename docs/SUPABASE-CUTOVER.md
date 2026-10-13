# Supabase â€” ativaÃ§Ã£o, preservaÃ§Ã£o de dados e rollback

Status: cutover autorizado e executado no ambiente local em 2026-10-13. O Supabase é o banco ativo; o PostgreSQL local e seu volume permanecem preservados apenas para rollback controlado. Não repetir este roteiro automaticamente ao fazer merge.

## Arquitetura e limites

O backend mantÃ©m autenticaÃ§Ã£o prÃ³pria e autorizaÃ§Ã£o por tenant no Express. Prisma usa `DATABASE_URL` em execuÃ§Ã£o e `DIRECT_URL` para migraÃ§Ãµes (fallback para `DATABASE_URL` no ambiente local). Para migraÃ§Ãµes, usar conexÃ£o direta ou Supavisor em modo sessÃ£o na porta 5432; nÃ£o usar o pooler transacional. As credenciais ficam no gerenciador de segredos. A conta Prisma deve ser proprietÃ¡ria das tabelas da aplicaÃ§Ã£o, separada de `anon`/`authenticated`; a mesma conta pode ser usada nas duas URLs. O acesso por tenant continua obrigatÃ³rio no backend porque o proprietÃ¡rio contorna RLS.

As 25 tabelas de aplicaÃ§Ã£o e `_prisma_migrations` recebem RLS e revogaÃ§Ã£o de privilÃ©gios para `PUBLIC`, `anon` e `authenticated`. NÃ£o sÃ£o criadas polÃ­ticas de acesso direto: o frontend chama Express, nÃ£o a Data API. As migraÃ§Ãµes seguintes devem manter essa regra; o teste de isolamento enumera os modelos do Prisma e detecta tabelas sem proteÃ§Ã£o. Desativar a Data API no projeto quando nÃ£o utilizada, como defesa adicional. Confirmar tambÃ©m que nÃ£o existem views/RPCs ou polÃ­ticas antigas que exponham os dados antes da ativaÃ§Ã£o.

O bucket pÃºblico destina-se a imagens de produtos e avatares. Ãudios de entregas usam exclusivamente o bucket privado, com prefixo tenant/entrega e URLs assinadas por cinco minutos apÃ³s autorizaÃ§Ã£o. NÃ£o conceder escrita direta a `anon`/`authenticated` no Storage. A chave service-role existe apenas no backend; ela contorna RLS, portanto a autorizaÃ§Ã£o do Express Ã© necessÃ¡ria. A inicializaÃ§Ã£o rejeita nomes iguais e visibilidade incorreta, sem tornar pÃºblicos buckets existentes.

## Merge nÃ£o troca o banco ativo

`docker-compose.coolify.yml` e `deploy/docker-compose.coolify.runtime.yml` preservam o serviÃ§o `db`, a conexÃ£o local padrÃ£o e o volume `therapist-platform-local-db`. A inicializaÃ§Ã£o automÃ¡tica de Storage Ã© desligada por padrÃ£o. Somente a inclusÃ£o explÃ­cita de `deploy/docker-compose.supabase.yml` habilita a conexÃ£o externa e a inicializaÃ§Ã£o dos buckets. O banco local permanece presente para recuperaÃ§Ã£o apÃ³s o corte. NÃ£o executar `down -v`, remover volumes, `migrate reset` ou iniciar uma base Supabase vazia como substituta dos dados locais.

## Preflight e backup â€” antes da autorizaÃ§Ã£o de corte

1. Identificar a instÃ¢ncia PostgreSQL local ativa, volume, versÃ£o, release e responsÃ¡vel. Registrar contagens por tabela e por tenant, totais de pedidos, vÃ­nculos e estado de `_prisma_migrations`, sem incluir dados pessoais nos relatÃ³rios.
2. Definir janela, RPO/RTO e congelamento das escritas. Seguir `PRODUCTION-BACKUP-RESTORE-RUNBOOK.md`: dump customizado com checksum, acesso restrito, cÃ³pia externa ao contÃªiner/volume e retenÃ§Ã£o. Usar cliente pg_dump compatÃ­vel com o servidor. O dump contÃ©m dados pessoais e nÃ£o entra no Git.
3. Executar restauraÃ§Ã£o de ensaio em destino isolado autorizado, comparando contagens, relaÃ§Ãµes, migraÃ§Ãµes e consultas da aplicaÃ§Ã£o. Repetir com dados sintÃ©ticos no CI nÃ£o substitui este ensaio operacional.
4. Verificar o destino Supabase: regiÃ£o, rede/TLS, quota, versÃ£o PostgreSQL, credenciais e conta proprietÃ¡ria de tabelas; nenhuma tabela da aplicaÃ§Ã£o deve ser sobrescrita. NÃ£o restaurar os schemas gerenciados `auth`/`storage`, nem roles internos do Supabase.
5. Revisar o inventÃ¡rio de objetos de Storage separadamente: backup do PostgreSQL nÃ£o copia bytes de arquivos. Confirmar os buckets, polÃ­ticas e escopo pÃºblico/privado; copiar objetos existentes apenas com autorizaÃ§Ã£o e verificar integridade e referÃªncias.
6. Obter autorizaÃ§Ã£o especÃ­fica para a transferÃªncia de dados e troca de banco. Esse gate nÃ£o foi executado por esta PR.

## ExecuÃ§Ã£o apÃ³s autorizaÃ§Ã£o especÃ­fica

1. Pausar todos os escritores (API, tarefas e integraÃ§Ãµes), fazer backup final e registrar ponto de corte.
2. Restaurar schema e dados da aplicaÃ§Ã£o, inclusive `_prisma_migrations`, no destino vazio/validado, com mapeamento de proprietÃ¡rio para a conta Prisma. Nunca sobrescrever dados existentes ou schemas gerenciados. Revisar previamente o plano de pg_restore e executÃ¡-lo com falha imediata em erro.
3. Rodar `prisma migrate status` e `prisma migrate deploy` usando `DIRECT_URL` no destino aprovado; aplicar somente migraÃ§Ãµes pendentes. Comparar contagens e integridade com a origem antes de expor trÃ¡fego. A migraÃ§Ã£o de seguranÃ§a nÃ£o apaga dados.
4. Conferir RLS/privilÃ©gios, ausÃªncia de exposiÃ§Ã£o via Data API e polÃ­ticas de Storage. Validar tentativas de acesso anÃ´nimo, entre tenants e URLs privadas. Executar smokes de login, catÃ¡logo, pedido, agendamento e entrega com contas de teste aprovadas.
5. Somente entÃ£o selecionar o overlay Supabase no Coolify, junto ao compose base e Ã s variÃ¡veis de `deploy/supabase.env.example`. Exemplo de composiÃ§Ã£o para revisÃ£o: `docker compose -f docker-compose.coolify.yml -f deploy/docker-compose.supabase.yml config --quiet`. NÃ£o imprimir a configuraÃ§Ã£o resolvida com segredos. Para imagens locais, usar o compose base de runtime com o mesmo overlay.
6. O backend ainda usa `prisma migrate deploy` no startup; isso mantÃ©m a trilha canÃ´nica, mas nÃ£o transfere os dados locais. Por isso, a restauraÃ§Ã£o e validaÃ§Ã£o precisam preceder a primeira inicializaÃ§Ã£o apontada ao Supabase.
7. Liberar escritas e monitorar erros, isolamento, latÃªncia e backups. Registrar responsÃ¡vel, horÃ¡rio, SHAs e evidÃªncias sem credenciais.

## Cutover executado — 2026-10-13

- Destino: projeto Supabase `therapist-platform` (`jxgcxfssbkgxxrpsjljx`).
- Backup pré-corte: `/home/claudio/therapist-backups/therapist-pre-supabase-20261012.dump`, SHA-256 `c2c3c5bb5e3b3ff51b3c6923c1028dd7c7c788b6d8e8fe04c45c88c8197ac14c`.
- A restauração foi ensaiada em PostgreSQL isolado antes do corte. Schema, relações e contagens críticas foram conferidos sem expor dados pessoais.
- `DATABASE_URL` passou a usar Supavisor transacional e `DIRECT_URL` Supavisor em modo sessão; TLS valida a cadeia pela Supabase Root 2021 CA empacotada no backend.
- As chaves modernas `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` são aceitas pelo backend com compatibilidade para os nomes legados. Segredos continuam somente no Coolify.
- O banco local foi mantido intacto. Depois da liberação de escritas no Supabase, ele não pode ser promovido novamente sem reconciliação dos dados.
- Homologação real validou login/sessão, isolamento entre tenants, catálogo/pedidos, leitura de agenda, Storage público, Storage privado com URL assinada, bloqueio de acesso cruzado, páginas autenticadas, mobile e logout. Fixtures temporárias foram removidas após o teste.
- SMTP e Stripe deste ambiente usam configuração de desenvolvimento e não fazem parte do gate de conectividade Supabase.
- A migração de hardening revoga execução direta de `public.rls_auto_enable()` para `PUBLIC`, `anon` e `authenticated`; o event trigger continua funcional.
## Rollback

- Antes de liberar escritas no Supabase: retirar o overlay, restaurar a configuraÃ§Ã£o local e a versÃ£o compatÃ­vel da aplicaÃ§Ã£o; validar saÃºde e contagens. O volume local preservado continua sendo a origem autoritativa.
- ApÃ³s liberar escritas: congelar novamente, fazer backup de ambos os lados e reconciliar os dados novos com procedimento aprovado. Voltar simplesmente Ã  cÃ³pia local antiga perderia essas gravaÃ§Ãµes e Ã© proibido.
- Rollback de aplicaÃ§Ã£o nÃ£o reverte esquema. NÃ£o desabilitar RLS nem reabrir grants para facilitar rollback; planejar migraÃ§Ã£o corretiva compatÃ­vel.

## EvidÃªncias e pendÃªncias

CI valida migraÃ§Ãµes em PostgreSQL descartÃ¡vel, RLS e grants para roles equivalentes aos da Data API, isolamento HTTP entre tenants, sessÃµes e testes do Storage com respostas simuladas. NÃ£o comprova conectividade, polÃ­ticas ou backups do projeto Supabase real. Permanecem operacionais: backup final, ensaio com dados autorizados, verificaÃ§Ã£o do projeto remoto, transferÃªncia dos arquivos e autorizaÃ§Ã£o de corte.

ReferÃªncias consultadas: [Prisma](https://supabase.com/docs/guides/database/prisma), [proteÃ§Ã£o da Data API](https://supabase.com/docs/guides/api/securing-your-api), [acesso ao Storage](https://supabase.com/docs/guides/storage/security/access-control).

Prisma CLI, client e adaptador pg estÃ£o fixados em 7.10.0 para manter geraÃ§Ã£o e execuÃ§Ã£o alinhadas.

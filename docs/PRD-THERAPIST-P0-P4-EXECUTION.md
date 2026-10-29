# Therapist Platform — P0 a P4: plano canônico de execução

Status: IN PROGRESS / AUDIT_REQUIRED
Base: origin/main@1fca9e5 (2026-10-28)
Ambiente de aplicação: Coolify local + Supabase. Nenhum ambiente adicional está autorizado.
Este plano não substitui provas de runtime, testes, nem decisões comerciais.

## Invariantes
- Preservar backend/.env.example e demais alterações locais preexistentes.
- Não imprimir, rotacionar, commitar ou alterar secrets.
- Não executar TRUNCATE, seed destrutivo ou migrations contra DATABASE_URL.
- Testes de integração exclusivamente em banco descartável localhost com sufixo _test.
- Não habilitar SAAS_BILLING_ENABLED nem Stripe live sem decisão específica.
- Não provisionar staging, produção ou serviços pagos implicitamente.
- Separar branches e PRs de implementação por frente; nunca usar merge automático.
- O banco Supabase ativo é a fonte de verdade; PostgreSQL local antigo só para rollback reconciliado.

## P0 — Technical readiness (bloqueante)
1. Corrigir os 3 alertas high e 4 moderate registrados no audit frontend do CI de 2026-10-23; registrar npm audit e compatibilidade Angular.
2. Fechar MIG-G3.H: secret scan de conteúdo e histórico com triagem, inventário de arquivos duplicados e governança, validação documental. Não tocar no .env.
3. Prover banco PostgreSQL local descartável *_test; executar as três suites orders/users/cards com NODE_ENV=test, sem tocar no Supabase de desenvolvimento.
4. Executar E2E Playwright contra o Coolify local com identidades de teste e dados isolados; registrar cenários PASS/FAIL/SKIP e evidências.
5. Reconciliar o smoke real de Storage privado no cutover 2026-10-13 com o runbook antigo; verificar bucket privado, URLs assinadas, isolamento e inventário de mídias legadas. Não migrar/apagar mídias sem inventário e backup.
6. Verificar todos os checks obrigatórios da main; corrigir regressões antes do aceite.
Aceite: nenhum high/critical aplicável sem exceção formal, testes de integração e jornadas essenciais verdes, segurança de Storage demonstrada, MIG-G3.H auditada.

## P1 — Operations / observabilidade
Implementar PO-04: logs estruturados e minimizados, correlação por request ID, métricas de health/readiness, latência e taxa de erros, alertas com limites documentados, retenção e testes de ausência de PII.
Revalidar PO-01 a PO-03 com Supabase ativo: backup externo seguro, restore drill em destino descartável, manifest SHA, smoke e rollback sem reverter schema destrutivamente.
PO-05/PO-06: preparar contratos e runbooks, mas não criar ambientes nem ativar deploy externo.
Aceite: alertas testados, runbooks operacionais reproduzíveis, restore comprovado e nenhum dado sensível em telemetria.

## P2 — Tenant Team & Invitations v1
Entidades tenant-scoped: invitation com hash do token, expiry, invitedEmail, role, status e auditoria; membership com active/suspended; transferência de owner atômica.
API: criar/listar/revogar/aceitar convites, listar/alterar/remover membros, transferir ownership.
Autorização: owner/admin por membership ativa; negar IDOR e cross-tenant; limites por entitlement; convites idempotentes; expiração e reuso de token; concorrência.
Frontend: tela de equipe, convite, estados pendente/expirado, confirmação de transferência e acessibilidade.
Aceite: testes unitários, integração PostgreSQL descartável, E2E multi-tenant e regressão de onboarding/sessões.

## P3 — Custom Domain Automation v1
Estados pending_verification, verified, provisioning, active, failed, disabled.
Validar hostname, provar posse por DNS challenge, evitar takeover e colisão cross-tenant; impedir fallback para tenant desconhecido.
Resolver host com precedência determinística, cache invalidável, instruções DNS, status TLS, revalidação e rollback.
TLS automatizado somente após infraestrutura autorizada; desenvolvimento pode usar provider mock e testes de contrato.
Aceite: testes DNS/host spoofing/cross-tenant, retries, timeout, rollback e E2E de resolução.

## P4 — Commercial Readiness v1
Entregar pricing configurável, trials e políticas de upgrade/downgrade, eventos de conversão, suporte, termos e checklist de marca/domínio/INPI.
Billing real continua desativado; Stripe test mode e webhooks idempotentes com testes de contrato e E2E.
Decisões humanas pendentes: marca comercial, preços, termos comerciais e ativação de cobrança; não presumir escolhas.
Aceite técnico: fluxo testado ponta a ponta sem transação real; aceite comercial condicionado às decisões explícitas.

## Ordem e paralelismo
- Frente A: P0 segurança + DB de testes + E2E + Storage.
- Frente B: P1 observabilidade (independente da correção do frontend).
- Frente C: P2 modelagem/implementação em branch isolada.
- Frente D: P3 contratos/DNS mock após estabilizar o resolvedor de tenants.
- Frente E: P4 planejamento e implementação em modo teste; ativação comercial somente por autorização.
- Cada frente abre PR próprio com diff mínimo, CI e evidência. Nenhuma etapa é declarada concluída apenas por PR mergeado.

## Evidência de entrada (não é aceite final)
- main@1fca9e5: Backend CI, Frontend CI, SAST e Security integration passaram; dependency audit frontend falhou; E2E skipped.
- Auditoria frontend: 7 advisories (3 high, 4 moderate).
- Local: backend 403 unitários, frontend 265 unitários; 3 suites de integração locais bloqueadas pelo guard *_test.
- Supabase cutover documentado em 2026-10-13; runbook de Storage exige reconciliação.
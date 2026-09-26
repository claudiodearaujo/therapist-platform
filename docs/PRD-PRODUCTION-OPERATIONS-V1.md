# PRD — Production Operations v1

**Status:** 🟡 Em andamento — PO-01 iniciado.
**Base:** `5808bd2604579ae5288dc7c97b18fc842050cb2e`.
**Data:** 2026-09-26.

## Objetivo

Transformar o runtime hoje reproduzível no Coolify local em uma operação preparada para staging/produção, com deploy, recuperação, observabilidade e rollback verificáveis. Esta trilha não autoriza exposição pública, billing SaaS real nem uso de dados reais em ambientes de teste.

## Guardrails

- Preservar isolamento multi-tenant e os gates do Security Hardening v1.
- `SAAS_BILLING_ENABLED=false` até decisão comercial explícita.
- Nenhum segredo real em Git, logs, artefatos ou documentação.
- Backup deve existir antes de migration destrutiva ou release com mudança de schema.
- Restore drill sempre em destino descartável; nunca sobrescrever banco ativo.
- Deploy deve ser promovido por SHA/tag imutável, não por estado local não versionado.
- Rollback de aplicação não executa rollback destrutivo de banco automaticamente.
- Staging e production devem ter bancos, volumes, secrets e storage isolados.
- E2E externo não pode pressupor acesso ao tailnet local.

## Fases

### PO-01 — Health, readiness e contrato de runtime

- separar liveness de readiness;
- manter `/health` compatível;
- `/health/live`: processo HTTP vivo, sem dependência externa;
- `/health/ready`: banco acessível e dependências mínimas prontas;
- healthcheck do backend deve usar readiness;
- documentar versão/SHA do release sem expor segredo;
- smoke local e CI.

**Aceite:** liveness responde 200 com banco saudável ou indisponível; readiness responde 503 quando banco falha; compose usa readiness.

### PO-02 — Backup, restore drill e RPO/RTO

- script versionado de backup PostgreSQL em formato custom;
- checksum SHA-256 e metadata do backup;
- retenção configurável fora do repositório;
- restore em banco descartável;
- verificação mínima de schema/migrations e contagens;
- limpeza explícita do banco de drill;
- runbook de incidente e evidência datada.

**Meta inicial:** RPO <= 24h e RTO operacional <= 4h até medição real justificar valor menor.

### PO-03 — Release e rollback operacional

- convenção SemVer/tag;
- release manifest com SHA, migration set e imagens;
- checklist pre-deploy;
- migration deploy antes da promoção;
- rollback de imagem por tag anterior;
- política forward-fix para schema;
- smoke obrigatório pós-deploy.

### PO-04 — Observabilidade e alertas

- health/readiness monitorados;
- Sentry sem PII conforme hardening;
- logs estruturados com retenção;
- métricas mínimas de disponibilidade, latência e erro;
- alertas acionáveis e sem segredos;
- correlação por request/event ID sem identificar paciente.

### PO-05 — Staging/production isolation

- ambientes dedicados;
- secrets independentes;
- banco/volume/storage independentes;
- `NODE_ENV=production` em production;
- API docs desabilitada por padrão;
- CORS/URLs/domínios explícitos;
- `TRUST_PROXY_CIDRS` restrito à topologia real;
- storage privado validado antes de mídia real.

### PO-06 — Deploy automatizado e DR

- promoção autorizada por workflow;
- runner com acesso somente ao ambiente alvo;
- gates obrigatórios antes do deploy;
- rollback documentado;
- disaster recovery tabletop;
- restore drill periódico;
- registro de release e evidência operacional.

## Gates de saída

1. Liveness/readiness separados e monitoráveis.
2. Backup automatizável e restore drill aprovado.
3. Release/rollback por artefato imutável documentado e testado.
4. Staging isolado disponível antes de production.
5. Production com secrets, proxy, docs, CORS e storage validados.
6. Observabilidade sem PII e alertas mínimos ativos.
7. Deploy autorizado exige os checks protegidos da `main`.
8. DR mínimo executado com RPO/RTO medidos.

## Sequência

`PO-01 → PO-02 → PO-03 → PO-04 → PO-05 → PO-06`.

PO-01 a PO-04 podem avançar no ambiente local. PO-05/PO-06 dependem de infraestrutura externa e decisões de hosting/domínio, mas seus contratos podem ser preparados sem habilitar produção.

## Evidência PO-01 — implementação local

- backend build: PASS;
- unit tests: 28/28 suites, 375/375 testes PASS;
- healthchecks de Dockerfile e composes atualizados para `/health/ready`;
- `/health` mantido como alias compatível de readiness;
- a suíte `npm test` completa revelou 3 suites de integração legadas que não compilam por fixtures anteriores ao tenant obrigatório. O problema é preexistente e deve ser corrigido em trilha separada; os gates atuais de integração PostgreSQL do Security Hardening permanecem independentes e verdes.

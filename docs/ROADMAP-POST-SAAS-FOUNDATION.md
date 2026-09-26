# Roadmap — Pós SaaS Foundation

## Estado de entrada

A Fase 3 — SaaS Foundation está concluída:

- v1 — tenant context e memberships;
- v2 — isolamento completo de dados;
- v3 — onboarding e branding;
- v4 — planos, entitlements e billing foundation;
- v5 — LGPD, auditoria, retenção e operações.

O ambiente local de referência permanece no Coolify/Tailscale, com billing SaaS real desligado.

## Objetivo

Levar o Therapist Platform de uma fundação SaaS funcional para um produto operável em produção, comercializável e seguro, sem misturar hardening técnico com decisões comerciais ainda não fechadas.

## Sequência recomendada

### P0 — Security Hardening v1

Status: 🟡 em fechamento. Código/CI, proteção da `main`, deploy local e smoke HTTP validados; armazenamento privado de mídias permanece como gate. [PRD](PRD-SECURITY-HARDENING-V1.md) e [runbook](SECURITY-HARDENING-V1-RUNBOOK.md).

Objetivo: reduzir risco técnico antes de abrir produção ou cobrança real.

Escopo:
- inventário e triagem de Dependabot/dependency alerts;
- atualização segura de dependências críticas/altas;
- SAST/dependency scanning como gate;
- revisão JWT/refresh token/session lifecycle;
- revisão rate limiting e proteção de endpoints sensíveis;
- CSP e headers de segurança;
- validação de CORS por ambiente;
- secrets/configuration hardening;
- revisão de uploads e URLs externas;
- revisão de logs/Sentry para PII;
- threat model do multi-tenant;
- testes explícitos de cross-tenant denial;
- checklist OWASP ASVS aplicável.

Saída:
- PRD Security Hardening v1;
- baseline de vulnerabilidades;
- plano de remediação por severidade;
- gates CI que impeçam regressões críticas.

### P1 — Production Operations v1

Status: 🟡 iniciado. [PRD](PRD-PRODUCTION-OPERATIONS-V1.md). PO-01 (health/readiness) em implementação; demais fases preservam exposição pública e billing desligados.

Objetivo: tornar deploy e recuperação reproduzíveis fora da máquina local.

Escopo:
- ambiente production/staging dedicado;
- estratégia de secrets;
- backups e restore drills;
- migrations e rollback operacional;
- health/readiness;
- observabilidade;
- runbooks;
- release/versioning;
- deploy automatizado autorizado;
- disaster recovery mínimo.

### P2 — Tenant Team & Invitations v1

Objetivo: permitir operação real com equipes.

Escopo:
- convites por e-mail;
- lifecycle do convite;
- papéis tenant-scoped;
- owner transfer;
- remoção/suspensão de membros;
- limites por entitlement;
- trilha de auditoria.

### P3 — Custom Domain Automation v1

Objetivo: transformar `customDomain` em capability operacional.

Escopo:
- verificação de posse;
- DNS instructions;
- resolução por host;
- TLS;
- estado de provisionamento;
- rollback;
- domínio default/fallback seguro.

### P4 — Commercial Readiness v1

Objetivo: preparar venda sem acoplar decisões comerciais ao código.

Escopo:
- pricing final;
- Stripe live;
- trials;
- políticas de upgrade/downgrade;
- termos comerciais;
- suporte;
- onboarding conversion;
- analytics de produto;
- definição da marca comercial;
- domínio público;
- materiais para pilotos/investidores.

## Regra de avanço

Cobrança SaaS real e exposição pública não devem ser habilitadas antes de Security Hardening v1 e Production Operations v1 alcançarem seus gates mínimos.

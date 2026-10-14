# Therapist Platform

Plataforma multi-tenant configurável para profissionais de serviços, com frontend Angular 20, backend Express 5/TypeScript, Prisma 7 e PostgreSQL/Supabase.

## Estrutura

- `frontend/`: aplicação Angular e interface pública/administrativa.
- `backend/`: API, schema e migrações Prisma, testes.
- `e2e/`: testes de ponta a ponta com Playwright.
- `deploy/`, `ops/`, `docker-compose.coolify.yml`: configuração e operações.
- `docs/`: PRDs, decisões, runbooks e registros de auditoria.

## Desenvolvimento

As dependências são instaladas por aplicação. Em `backend/`, execute `npm ci`, `npm run build` e `npm run test:unit`. Em `frontend/`, execute `npm ci` e `npm run build`. Execute testes de integração e E2E somente com um ambiente de teste configurado, evitando dados reais. Não aplique migrations, seed ou deploy em infraestrutura compartilhada sem autorização explícita.

As configurações reais e credenciais devem ser fornecidas pelo ambiente, nunca versionadas. Consulte `backend/.env.example` somente como referência de nomes de variáveis; não substitua configurações locais existentes.

## Documentação e fonte de verdade

- [Governança de agentes](AGENTS.md)
- [Produto e arquitetura](docs/PRODUCTIZATION.md)
- [PRDs de domínio](docs/PRD-GENERIC-DOMAIN.md)
- [Roadmap SaaS](docs/ROADMAP-POST-SAAS-FOUNDATION.md)
- [Integração Supabase](docs/SUPABASE-CUTOVER.md)
- [Ambiente local Coolify](docs/COOLIFY-LOCAL.md)
- [Segurança](docs/SECURITY-BASELINE-V1.md)
- [Auditoria de higiene MIG-G3.H](docs/migration/MIG-G3.H-REPOSITORY-HYGIENE.md)

PRDs descrevem requisitos e decisões, não comprovam sozinhos a implantação. Documentos de auditoria e status datados são históricos; confirme o estado corrente no código, testes e ambiente antes de afirmar conclusão ou prontidão para produção.

# Coolify local — Therapist Platform

## Objetivo

Executar o Therapist Platform em um stack dedicado no Coolify local, sem compartilhar banco, rede ou volume com Invest Lucy ou outros projetos.

## Stack

`docker-compose.coolify.yml` cria:

- `db`: PostgreSQL 16 dedicado;
- `backend`: API Node/Express + Prisma, porta interna 3000;
- `frontend`: Angular estático em Nginx, com proxy same-origin de `/api` para o backend;
- volume persistente `therapist-platform-local-db`;
- rede dedicada `therapist-platform-local`.

O frontend é publicado por padrão em `18080/tcp` no host. O valor pode ser alterado por `APP_PORT` caso a porta já esteja ocupada.

## Segurança

Não versionar valores reais de:

- `POSTGRES_PASSWORD`;
- `JWT_SECRET`;
- `JWT_REFRESH_SECRET`;
- credenciais Supabase;
- credenciais Stripe;
- credenciais SMTP.

Use `deploy/coolify.local.env.example` apenas como catálogo de variáveis.

## Compatibilidade local

O stack sobe o backend com `NODE_ENV=development` para que integrações externas não sejam obrigatórias no ambiente local. Os defaults de Supabase, Stripe e SMTP permitem iniciar o sistema, mas funcionalidades que chamam esses provedores só funcionam quando credenciais locais/teste reais forem configuradas.

Sessões usam cookie HttpOnly e proteção de origem. `FRONTEND_URL` é sempre permitido; origens adicionais devem ser declaradas explicitamente em `CORS_ALLOWED_ORIGINS`, separadas por vírgula. O compose local inclui por padrão `http://127.0.0.1:18080` e `http://localhost:18080`.

Como o frontend Nginx encaminha `X-Forwarded-For`, configure `TRUST_PROXY_CIDRS` com o CIDR exato da rede dedicada do stack. Não use `true`, `0.0.0.0/0` nem uma faixa ampla sem necessidade; confirme o subnet com `docker network inspect`.

O backend executa automaticamente:

```sh
npx prisma migrate deploy
```

antes de iniciar a API.

## Verificações

Depois do deploy:

- frontend: `GET /health` → 200;
- backend via proxy: `GET /api/tenant/current` → tenant `default`;
- settings públicos: `GET /api/settings/public`;
- containers `db`, `backend` e `frontend` devem estar healthy.

## Tailscale

Não sobrescreva regras `tailscale serve` existentes.

A exposição mais conservadora é usar o MagicDNS/nome Tailscale do host com a porta dedicada:

```text
http://<hostname-tailscale>:18080
```

Se houver conflito na porta, ajuste `APP_PORT` no Coolify.

Antes de adicionar uma regra HTTPS com `tailscale serve`, inspecione a configuração existente e preserve todos os serviços já publicados.

Se o navegador acessar a aplicação por uma URL HTTPS do Tailscale, inclua a origem exata (esquema + host + porta) em `CORS_ALLOWED_ORIGINS`; não use wildcard. Exemplo: `https://host.tailnet.ts.net:7443`.

Quando esse endereço Tailscale for o gateway compartilhado usado para acessar a aplicação, configure também `FRONTEND_URL` e `BACKEND_URL` com essa URL exata. O resolvedor multi-tenant usa os hosts dessas duas variáveis como allowlist de hosts compartilhados; CORS sozinho não autoriza resolução de tenant. Um host de gateway ausente dessa allowlist retorna `TENANT_NOT_FOUND`/404 por desenho de segurança.


## CI, E2E e deploy

O GitHub Actions continua responsável pelos gates reprodutíveis de backend e frontend em pull requests e pushes.

Os testes E2E são smoke tests contra uma aplicação já implantada. Como o ambiente local atual é acessível apenas pela tailnet, runners públicos do GitHub não conseguem assumir acesso a ele. Por isso o job E2E só é executado quando as variáveis do repositório estiverem explicitamente configuradas:

- `E2E_ENABLED=true`;
- `E2E_BASE_URL` apontando para um ambiente acessível pelo runner.

Sem essas variáveis, o job é ignorado e não mascara os gates de build/unit.

Para validar o ambiente local, execute o Playwright a partir de uma máquina conectada à tailnet usando a URL publicada do Therapist Platform.

Os workflows legados de deploy automático no Render foram removidos. O destino ativo deste ambiente é o Coolify local. A automação remota de deploy deverá ser reintroduzida apenas quando existir um runner/webhook autorizado capaz de alcançar o Coolify sem expor a tailnet publicamente.

# Configuração de Variáveis de Ambiente - NFC-e SEFAZ-SP

Este documento descreve todas as variáveis de ambiente necessárias para executar a aplicação NFC-e SEFAZ-SP.

## Arquivos de Configuração

- `.env.local` - Variáveis para desenvolvimento local (já configurado)
- `.env.production.example` - Template para produção (copie e configure)
- `.env.development.example` - Template para desenvolvimento

## Variáveis de Ambiente Atuais

### Banco de Dados

```
DATABASE_URL=mysql://4Hknom2H8YmSWG5.b4557c4a5ff9:LccW6c420bHUv5UxolP8@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/PztakRQLiogvwshfqjZK5n?ssl={"rejectUnauthorized":true}
```

**Descrição:** String de conexão MySQL com TiDB Cloud. Inclui credenciais de usuário, host, porta e banco de dados.

### Autenticação e Segurança

```
JWT_SECRET=feF496y3HeAWBpoTgFMBFE
VITE_APP_ID=PztakRQLiogvwshfqjZK5n
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `JWT_SECRET` | `feF496y3HeAWBpoTgFMBFE` | Chave secreta para assinar tokens JWT |
| `VITE_APP_ID` | `PztakRQLiogvwshfqjZK5n` | ID da aplicação no Manus |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | URL do servidor OAuth Manus |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` | URL do portal de login Manus |

### Informações do Proprietário

```
OWNER_OPEN_ID=4rFAMB5GU4gMtPCUGqKP5d
OWNER_NAME=Wagner Mobile Costa
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `OWNER_OPEN_ID` | `4rFAMB5GU4gMtPCUGqKP5d` | ID único do proprietário da aplicação |
| `OWNER_NAME` | `Wagner Mobile Costa` | Nome do proprietário |

### APIs Manus Built-in

```
BUILT_IN_FORGE_API_URL=https://forge.manus.ai
BUILT_IN_FORGE_API_KEY=eXsotPHiQrdrfB68kbCkWF
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `BUILT_IN_FORGE_API_URL` | `https://forge.manus.ai` | URL da API Forge (backend) |
| `BUILT_IN_FORGE_API_KEY` | `eXsotPHiQrdrfB68kbCkWF` | Chave de API para backend |

### APIs Frontend

```
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.ai
VITE_FRONTEND_FORGE_API_KEY=TURfzRbX8QHMv9UGzypHJ2
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_FRONTEND_FORGE_API_URL` | `https://forge.manus.ai` | URL da API Forge (frontend) |
| `VITE_FRONTEND_FORGE_API_KEY` | `TURfzRbX8QHMv9UGzypHJ2` | Chave de API para frontend |

### Analytics

```
VITE_ANALYTICS_ENDPOINT=https://manus-analytics.com
VITE_ANALYTICS_WEBSITE_ID=7807eb0d-6c32-4d0d-8a14-41ec77f956f2
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_ANALYTICS_ENDPOINT` | `https://manus-analytics.com` | Endpoint de analytics |
| `VITE_ANALYTICS_WEBSITE_ID` | `7807eb0d-6c32-4d0d-8a14-41ec77f956f2` | ID do website para rastreamento |

### Configuração da Aplicação

```
VITE_APP_TITLE=Consulta NFC-e SEFAZ-SP
VITE_APP_LOGO=https://files.manuscdn.com/user_upload_by_module/web_dev_logo/310519663087333620/rDpkRrSQESXkWuZG.png
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_APP_TITLE` | `Consulta NFC-e SEFAZ-SP` | Título da aplicação |
| `VITE_APP_LOGO` | URL CDN | URL do logo da aplicação |

### Ambiente

```
NODE_ENV=development
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `development` ou `production` | Ambiente de execução |

## Como Usar

### Desenvolvimento Local

O arquivo `.env.local` já está configurado com as variáveis atuais. Para usar:

```bash
# As variáveis são carregadas automaticamente
pnpm dev
```

### Produção (Vercel)

1. Copie o arquivo `.env.production.example`:
```bash
cp .env.production.example .env.production
```

2. Configure as variáveis em "Settings" → "Environment Variables" na Vercel:
   - `DATABASE_URL` - String de conexão do banco de produção
   - `JWT_SECRET` - Gere uma nova chave: `openssl rand -base64 32`
   - Demais variáveis conforme necessário

3. Deploy automático quando você faz push para `main`

### Produção (Manus)

As variáveis são gerenciadas automaticamente pelo Manus. Clique em "Publish" para fazer deploy.

## Segurança

⚠️ **IMPORTANTE:**

- Nunca commit `.env` ou `.env.local` com valores reais no repositório
- O arquivo `.env.local` está no `.gitignore` por segurança
- Sempre use variáveis de ambiente para dados sensíveis
- Regenere `JWT_SECRET` em produção
- Mantenha `BUILT_IN_FORGE_API_KEY` seguro (não compartilhe)

## Alterando Variáveis

Para alterar variáveis de ambiente:

### Desenvolvimento Local

1. Edite `.env.local`
2. Reinicie o servidor: `pnpm dev`

### Produção (Vercel)

1. Vá para "Settings" → "Environment Variables"
2. Edite a variável
3. Redeploy: `git push origin main`

### Produção (Manus)

1. Vá para "Settings" → "Secrets"
2. Edite a variável
3. Redeploy automaticamente

## Troubleshooting

### Variáveis não estão sendo lidas

1. Verifique se o arquivo `.env.local` existe
2. Reinicie o servidor: `pnpm dev`
3. Verifique o console para erros

### Erro de conexão ao banco

1. Verifique `DATABASE_URL`
2. Teste a conexão: `mysql -h host -u user -p database`
3. Confirme que o IP está na whitelist

### Erro de autenticação OAuth

1. Verifique `VITE_APP_ID` e `OAUTH_SERVER_URL`
2. Confirme que as URLs estão acessíveis
3. Verifique os logs do servidor

## Referência Completa

| Variável | Tipo | Obrigatória | Descrição |
|----------|------|-------------|-----------|
| `DATABASE_URL` | String | Sim | String de conexão MySQL |
| `JWT_SECRET` | String | Sim | Chave secreta para JWT |
| `VITE_APP_ID` | String | Sim | ID da aplicação Manus |
| `OAUTH_SERVER_URL` | URL | Sim | URL do servidor OAuth |
| `VITE_OAUTH_PORTAL_URL` | URL | Sim | URL do portal OAuth |
| `OWNER_OPEN_ID` | String | Sim | ID do proprietário |
| `OWNER_NAME` | String | Sim | Nome do proprietário |
| `BUILT_IN_FORGE_API_URL` | URL | Sim | URL da API Forge |
| `BUILT_IN_FORGE_API_KEY` | String | Sim | Chave da API Forge |
| `VITE_FRONTEND_FORGE_API_URL` | URL | Sim | URL da API Forge (frontend) |
| `VITE_FRONTEND_FORGE_API_KEY` | String | Sim | Chave da API Forge (frontend) |
| `VITE_ANALYTICS_ENDPOINT` | URL | Não | Endpoint de analytics |
| `VITE_ANALYTICS_WEBSITE_ID` | String | Não | ID do website |
| `VITE_APP_TITLE` | String | Não | Título da aplicação |
| `VITE_APP_LOGO` | URL | Não | URL do logo |
| `NODE_ENV` | String | Não | Ambiente (development/production) |

---

**Última atualização:** 2026-03-11
**Versão:** 1.0

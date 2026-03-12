# Deployment - NFC-e SEFAZ-SP

## Quick Start para Vercel

### 1. Preparar Repositório Git

```bash
git init
git add .
git commit -m "NFC-e SEFAZ-SP application"
gh repo create nfc-sefaz-app --private --source=. --remote=origin --push
```

### 2. Conectar à Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New..." → "Project"
3. Selecione seu repositório `nfc-sefaz-app`
4. Clique em "Import"

### 3. Configurar Variáveis de Ambiente

Na página de configuração do Vercel, adicione as variáveis em "Settings" → "Environment Variables":

```
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=seu-jwt-secret
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu-owner-id
OWNER_NAME=Seu Nome
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua-frontend-api-key
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu-website-id
VITE_APP_TITLE=NFC-e SEFAZ-SP
VITE_APP_LOGO=https://seu-cdn.com/logo.png
NODE_ENV=production
```

### 4. Deploy

```bash
git push origin main
```

O deploy acontece automaticamente!

## Alternativa: Deploy na Manus (Recomendado)

A Manus oferece hospedagem integrada:

1. Clique no botão "Publish" na interface Manus
2. Configure domínio em "Settings" → "Domains"
3. Pronto! Sua aplicação está publicada

## Verificação Pós-Deploy

```bash
# Testar endpoint de autenticação
curl https://seu-dominio.com/api/trpc/auth.me

# Verificar saúde da aplicação
curl https://seu-dominio.com/
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | Verifique `pnpm build` localmente |
| Variáveis não carregam | Confirme em "Environment Variables" da Vercel |
| Banco não conecta | Verifique `DATABASE_URL` e whitelist de IP |
| Erro 502 | Veja logs em Deployments → Logs |

## Documentação Completa

Veja `DEPLOY_VERCEL.md` para guia detalhado com todas as opções.

## Monitoramento

- **Logs**: Vercel Dashboard → Deployments → Logs
- **Performance**: Vercel Dashboard → Analytics
- **Alertas**: Settings → Alerts

## Rollback

Se algo der errado:
1. Vercel Dashboard → Deployments
2. Encontre o deployment anterior
3. Clique nos três pontos → "Promote to Production"

---

**Dúvidas?** Consulte https://help.manus.im ou https://vercel.com/docs

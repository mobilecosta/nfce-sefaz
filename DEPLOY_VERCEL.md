# Guia de Deploy na Vercel - NFC-e SEFAZ-SP

Este documento descreve como publicar a aplicação NFC-e SEFAZ-SP na Vercel.

## Pré-requisitos

- Conta na Vercel (https://vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Variáveis de ambiente configuradas

## Opção 1: Deploy via GitHub (Recomendado)

### 1. Preparar o Repositório

```bash
# Inicializar repositório Git (se não existir)
git init
git add .
git commit -m "Initial commit: NFC-e SEFAZ-SP application"

# Criar repositório no GitHub
gh repo create nfc-sefaz-app --private --source=. --remote=origin --push
```

### 2. Conectar à Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New..." → "Project"
3. Selecione "Import Git Repository"
4. Escolha seu repositório `nfc-sefaz-app`
5. Clique em "Import"

### 3. Configurar Variáveis de Ambiente

Na página de configuração do projeto Vercel:

1. Vá para "Settings" → "Environment Variables"
2. Adicione as seguintes variáveis (obtenha os valores do seu ambiente Manus):

```
DATABASE_URL = mysql://user:password@host:port/database
JWT_SECRET = seu-jwt-secret
VITE_APP_ID = seu-app-id
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = https://portal.manus.im
OWNER_OPEN_ID = seu-owner-id
OWNER_NAME = Seu Nome
BUILT_IN_FORGE_API_URL = https://api.manus.im
BUILT_IN_FORGE_API_KEY = sua-api-key
VITE_FRONTEND_FORGE_API_URL = https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY = sua-frontend-api-key
VITE_ANALYTICS_ENDPOINT = https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID = seu-website-id
VITE_APP_TITLE = NFC-e SEFAZ-SP
VITE_APP_LOGO = https://seu-cdn.com/logo.png
NODE_ENV = production
```

### 4. Configurar Domínio Customizado (Opcional)

1. Vá para "Settings" → "Domains"
2. Adicione seu domínio customizado
3. Configure os registros DNS conforme instruído pela Vercel

### 5. Deploy

O deploy acontece automaticamente quando você faz push para a branch principal:

```bash
git push origin main
```

## Opção 2: Deploy via CLI Vercel

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Fazer Login

```bash
vercel login
```

### 3. Deploy

```bash
vercel --prod
```

Siga as instruções interativas para configurar o projeto.

## Opção 3: Deploy na Manus (Recomendado)

A Manus oferece hospedagem integrada com suporte a domínios customizados:

1. Clique no botão "Publish" na interface Manus
2. Configure seu domínio customizado em "Settings" → "Domains"
3. A aplicação será publicada automaticamente

## Verificação Pós-Deploy

### 1. Testar Endpoints

```bash
# Testar autenticação
curl https://seu-dominio.com/api/trpc/auth.me

# Testar saúde da aplicação
curl https://seu-dominio.com/
```

### 2. Verificar Logs

Na Vercel:
1. Vá para "Deployments"
2. Clique no deployment mais recente
3. Vá para "Logs" para ver detalhes de build e runtime

### 3. Validar Banco de Dados

```bash
# Conectar ao banco de dados de produção
mysql -h seu-host -u seu-user -p seu-database

# Verificar tabelas
SHOW TABLES;
```

## Troubleshooting

### Build falha com erro de dependências

```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Variáveis de ambiente não estão sendo lidas

1. Verifique se as variáveis estão configuradas em "Settings" → "Environment Variables"
2. Certifique-se de que o nome das variáveis está correto
3. Redeploy após adicionar/modificar variáveis

### Banco de dados não conecta

1. Verifique a string de conexão `DATABASE_URL`
2. Confirme que o IP da Vercel está na whitelist do banco
3. Teste a conexão localmente com a mesma string

### Erro 502 Bad Gateway

1. Verifique os logs de build e runtime
2. Confirme que o servidor Express está ouvindo na porta correta
3. Verifique se há erros de inicialização no banco de dados

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão MySQL | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Chave secreta para JWT | Gere com: `openssl rand -base64 32` |
| `VITE_APP_ID` | ID da aplicação Manus | Obtém no dashboard Manus |
| `OAUTH_SERVER_URL` | URL do servidor OAuth | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | URL do portal OAuth | `https://portal.manus.im` |
| `OWNER_OPEN_ID` | ID do proprietário | Obtém no dashboard Manus |
| `OWNER_NAME` | Nome do proprietário | Seu nome |
| `BUILT_IN_FORGE_API_URL` | URL da API Forge | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Chave da API Forge | Obtém no dashboard Manus |
| `VITE_FRONTEND_FORGE_API_URL` | URL da API Forge (frontend) | `https://api.manus.im` |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave da API Forge (frontend) | Obtém no dashboard Manus |
| `VITE_ANALYTICS_ENDPOINT` | Endpoint de analytics | `https://analytics.manus.im` |
| `VITE_ANALYTICS_WEBSITE_ID` | ID do website para analytics | Obtém no dashboard Manus |
| `VITE_APP_TITLE` | Título da aplicação | `NFC-e SEFAZ-SP` |
| `VITE_APP_LOGO` | URL do logo | URL CDN do logo |
| `NODE_ENV` | Ambiente | `production` |

## Monitoramento em Produção

### Logs da Aplicação

Acesse os logs em tempo real na Vercel:
- Dashboard → Deployments → Logs

### Métricas de Performance

Na Vercel:
- Dashboard → Analytics
- Veja requisições, latência e erros

### Alertas

Configure alertas em "Settings" → "Alerts" para:
- Build failures
- Function errors
- High latency

## Rollback

Se algo der errado após o deploy:

1. Na Vercel, vá para "Deployments"
2. Encontre o deployment anterior que funcionava
3. Clique nos três pontos e selecione "Promote to Production"

## Suporte

Para problemas:
- Documentação Vercel: https://vercel.com/docs
- Suporte Manus: https://help.manus.im
- Issues do projeto: GitHub Issues

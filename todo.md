# Projeto NFC-e SEFAZ-SP - TODO

## Fase 1: Análise e Arquitetura
- [x] Analisar documentação técnica SEFAZ-SP
- [x] Definir arquitetura de integração com WebServices
- [x] Documentar fluxo de autenticação com certificado digital

## Fase 2: Modelo de Dados e Autenticação
- [x] Criar schema de banco de dados (usuários, certificados, consultas, downloads)
- [x] Implementar autenticação Manus OAuth
- [x] Criar tabelas para armazenar metadados de certificados
- [x] Implementar tabelas de auditoria (logs de consultas e downloads)

## Fase 3: Integração WebServices SEFAZ-SP
- [x] Implementar cliente SOAP para NFCeListagemChaves
- [x] Implementar cliente SOAP para NFCeDownloadXML
- [x] Criar procedures tRPC para listagem de chaves
- [x] Criar procedures tRPC para download de XMLs
- [x] Implementar tratamento de erros e limites de requisição

## Fase 4: Gerenciamento de Certificados
- [x] Criar interface de upload de certificado e-CNPJ (arquivo .pfx/.p12)
- [x] Implementar armazenamento seguro de certificados em S3
- [x] Criar procedures para validação de certificado
- [ ] Implementar rotação e revogação de certificados

## Fase 5: Interface de Consulta e Download
- [x] Criar formulário de consulta (CNPJ, data inicial, data final)
- [ ] Implementar listagem de chaves de acesso com paginação
- [ ] Criar funcionalidade de download individual de XML
- [ ] Implementar download em lote de XMLs
- [ ] Armazenar XMLs baixados em S3

## Fase 6: Painel Administrativo
- [x] Criar dashboard administrativo
- [x] Implementar gerenciamento de usuários (criar, editar, deletar, ativar/desativar)
- [x] Criar visualização de logs de consultas e downloads
- [ ] Implementar relatórios de auditoria avançados
- [ ] Adicionar filtros e busca em logs

## Fase 7: Estética Brutalista
- [x] Aplicar tipografia sans-serif massiva e pesada
- [x] Implementar layout com alto contraste (preto/branco)
- [ ] Usar colchetes e sublinhados como elementos geométricos
- [x] Criar espaço negativo abundante
- [x] Implementar assimetria e hierarquia visual rígida

## Fase 8: Testes e Entrega
- [x] Escrever testes unitários (vitest)
- [ ] Testar integração com SEFAZ-SP
- [ ] Testar fluxos de upload e download
- [ ] Testar painel administrativo
- [ ] Criar documentação de uso
- [ ] Preparar checkpoint final


## Fase 9: Download em Lote
- [x] Instalar dependência archiver para criação de ZIP
- [x] Implementar procedure tRPC para download em lote
- [x] Criar página de detalhes de consulta com seleção múltipla
- [x] Implementar gerenciamento de progresso de download
- [x] Testar download em lote com múltiplos XMLs
- [x] Validar integridade dos arquivos ZIP


## Fase 10: Barra de Progresso em Tempo Real
- [x] Implementar gerenciador de sessão de progresso
- [x] Criar endpoint SSE para streaming de eventos
- [x] Implementar hook useDownloadProgress no frontend
- [x] Criar componente ProgressBar com animações
- [x] Integrar progresso no QueryDetails
- [x] Testar SSE com múltiplos downloads simultâneos


## Fase 11: Correção de Bugs
- [x] Corrigir apresentação do botão "Certificados" na Home
- [x] Corrigir página Certificates.tsx não sendo exibida
- [x] Validar navegação entre páginas
- [x] Testar responsividade em mobile


## Fase 12: Preparação para Vercel
- [x] Criar arquivo vercel.json com configurações de build e rotas
- [x] Otimizar package.json para produção
- [x] Configurar variáveis de ambiente para Vercel
- [x] Testar build de produção localmente
- [x] Documentar processo de deploy na Vercel
- [x] Configurar domínio customizado (opcional)
- [x] Criar checkpoint final para publicação

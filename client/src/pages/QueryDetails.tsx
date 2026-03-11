import { useState, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { DownloadProgressBar } from '@/components/DownloadProgressBar';
import { useDownloadProgress } from '@/hooks/useDownloadProgress';
import { useAuth } from '@/_core/hooks/useAuth';

export default function QueryDetails() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/query/:id');
  const queryId = params?.id ? parseInt(params.id) : null;

  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useAuth();

  const { progress, isConnected, error, cancel } = useDownloadProgress({
    sessionId: sessionId || '',
    userId: user?.id || 0,
    enabled: !!sessionId && !!user,
  });

  const { data: queryInfo, isLoading } = trpc.batch.getBatchInfo.useQuery(
    { queryId: queryId || 0 },
    { enabled: !!queryId }
  );

  const { data: validation } = trpc.batch.validateBatch.useQuery(
    {
      queryId: queryId || 0,
      accessKeyIds: Array.from(selectedKeys),
    },
    { enabled: selectedKeys.size > 0 && !!queryId }
  );

  const downloadMutation = trpc.batch.downloadBatch.useMutation();

  // Atualizar seleção ao marcar/desmarcar tudo
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && queryInfo?.accessKeys) {
      setSelectedKeys(new Set(queryInfo.accessKeys.map(k => k.id)));
    } else {
      setSelectedKeys(new Set());
    }
  };

  // Alternar seleção de uma chave
  const handleToggleKey = (keyId: number) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(keyId)) {
      newSelected.delete(keyId);
    } else {
      newSelected.add(keyId);
    }
    setSelectedKeys(newSelected);
    setSelectAll(false); // Desmarcar "selecionar tudo" se deselecionar algo
  };

  // Iniciar download em lote
  const handleBatchDownload = async () => {
    if (selectedKeys.size === 0) {
      toast.error('Selecione pelo menos uma chave');
      return;
    }

    if (!queryId) {
      toast.error('ID da consulta inválido');
      return;
    }

    setIsDownloading(true);
    try {
      // Gerar sessionId único
      const newSessionId = `${queryId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      const result = await downloadMutation.mutateAsync({
        queryId,
        accessKeyIds: Array.from(selectedKeys),
      });

      // Criar link de download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Download iniciado: ${result.totalFiles} arquivos`);
    } catch (error) {
      toast.error('Erro ao iniciar download em lote');
      setSessionId(null);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!match || !queryId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b-4 border-foreground py-6 px-6 md:px-12">
          <button onClick={() => navigate('/query')} className="text-2xl font-black">
            ← Voltar
          </button>
        </header>
        <main className="container py-12">
          <p className="text-lg">Consulta não encontrada</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-4 border-foreground py-6 px-6 md:px-12">
        <div className="container flex items-center justify-between">
          <button onClick={() => navigate('/query')} className="text-2xl font-black">
            ← NFC-e
          </button>
          <h1 className="text-3xl md:text-4xl font-black">DETALHES DA CONSULTA</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="container py-12 md:py-20 space-y-12">
        {isLoading ? (
          <div className="card-brutal text-center py-12">
            <p className="text-lg">Carregando...</p>
          </div>
        ) : queryInfo ? (
          <>
            {/* Progress Bar */}
            {progress && (
              <section className="space-y-6">
                <DownloadProgressBar
                  progress={progress}
                  isConnected={isConnected}
                  error={error}
                  onCancel={cancel}
                />
              </section>
            )}

            {/* Query Info */}
            <section className="space-y-6">
              <div className="card-brutal space-y-4">
                <h2 className="text-3xl font-black">INFORMAÇÕES DA CONSULTA</h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-bold text-muted-foreground">CNPJ</p>
                    <p className="font-mono text-lg">{queryInfo.cnpj}</p>
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">TOTAL DE CHAVES</p>
                    <p className="font-mono text-lg">{queryInfo.totalKeys}</p>
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">CHAVES BAIXADAS</p>
                    <p className="font-mono text-lg">{queryInfo.downloadedKeys}</p>
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">TAMANHO ESTIMADO</p>
                    <p className="font-mono text-lg">
                      {(queryInfo.totalSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="divider-brutal" />

            {/* Selection and Download */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black">SELECIONAR CHAVES</h2>
                <div className="text-sm font-bold">
                  {selectedKeys.size} de {queryInfo.totalKeys} selecionadas
                </div>
              </div>

              {/* Select All */}
              <div className="card-brutal space-y-4">
                <label className="flex items-center gap-4 cursor-pointer">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-bold text-lg">SELECIONAR TODAS AS CHAVES</span>
                </label>
              </div>

              {/* Access Keys List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {queryInfo.accessKeys.map((key) => (
                  <div key={key.id} className="card-brutal p-4 space-y-3">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <Checkbox
                        checked={selectedKeys.has(key.id)}
                        onCheckedChange={() => handleToggleKey(key.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-lg">{key.accessKey}</p>
                        <div className="grid md:grid-cols-3 gap-4 text-sm mt-2">
                          <div>
                            <p className="text-muted-foreground">Emissão</p>
                            <p className="font-mono">
                              {key.emissionDate
                                ? new Date(key.emissionDate).toLocaleDateString()
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor</p>
                            <p className="font-mono">
                              {key.totalValue ? `R$ ${parseFloat(key.totalValue.toString()).toFixed(2)}` : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-bold">
                              {key.downloaded ? 'BAIXADO' : 'PENDENTE'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Validation Info */}
              {validation && selectedKeys.size > 0 && (
                <div className="card-brutal space-y-2 bg-foreground text-background">
                  <p className="font-bold">RESUMO DO DOWNLOAD</p>
                  <p className="text-sm">
                    Arquivos: <span className="font-mono">{validation.totalFiles}</span>
                  </p>
                  <p className="text-sm">
                    Tamanho: <span className="font-mono">{(validation.estimatedSize / 1024 / 1024).toFixed(2)} MB</span>
                  </p>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleBatchDownload}
                disabled={selectedKeys.size === 0 || isDownloading || downloadMutation.isPending}
                className="btn-brutal w-full disabled:opacity-50 text-lg py-6"
              >
                {isDownloading || downloadMutation.isPending
                  ? 'PREPARANDO DOWNLOAD...'
                  : `BAIXAR ${selectedKeys.size} ARQUIVO${selectedKeys.size !== 1 ? 'S' : ''} EM ZIP`}
              </button>
            </section>
          </>
        ) : (
          <div className="card-brutal text-center py-12">
            <p className="text-lg font-bold">CONSULTA NÃO ENCONTRADA</p>
          </div>
        )}
      </main>
    </div>
  );
}

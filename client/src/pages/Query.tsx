import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Query() {
  const [, navigate] = useLocation();
  const [certificateId, setCertificateId] = useState<number | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: certificates } = trpc.certificate.list.useQuery();
  const { data: queries, refetch: refetchQueries } = trpc.nfce.getQueries.useQuery();
  const queryMutation = trpc.nfce.query.useMutation();

  const handleQuery = async () => {
    if (!certificateId || !cnpj || !startDate || !endDate) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await queryMutation.mutateAsync({
        certificateId,
        cnpj,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      toast.success('Consulta iniciada');
      setCnpj('');
      setStartDate('');
      setEndDate('');
      refetchQueries();
    } catch (error) {
      toast.error('Erro ao realizar consulta');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-4 border-foreground py-6 px-6 md:px-12">
        <div className="container flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-2xl font-black">
            ← NFC-e
          </button>
          <h1 className="text-3xl md:text-4xl font-black">CONSULTAR NFC-e</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="container py-12 md:py-20 space-y-12">
        {/* Query Form */}
        <section className="space-y-6">
          <h2 className="text-4xl font-black">NOVA CONSULTA</h2>

          <div className="card-brutal space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold">CERTIFICADO</label>
              <select
                value={certificateId || ''}
                onChange={(e) => setCertificateId(Number(e.target.value))}
                className="w-full border-2 border-foreground p-4 font-mono text-sm"
              >
                <option value="">Selecione um certificado</option>
                {certificates?.map((cert) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.certificateName} ({cert.cnpj})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold">CNPJ</label>
              <input
                type="text"
                placeholder="00000000000000"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))}
                className="w-full border-2 border-foreground p-4 font-mono text-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold">DATA INICIAL</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border-2 border-foreground p-4 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold">DATA FINAL</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border-2 border-foreground p-4 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleQuery}
              disabled={queryMutation.isPending}
              className="btn-brutal w-full disabled:opacity-50"
            >
              {queryMutation.isPending ? 'CONSULTANDO...' : 'CONSULTAR SEFAZ'}
            </button>
          </div>
        </section>

        <div className="divider-brutal" />

        {/* Queries History */}
        <section className="space-y-6">
          <h2 className="text-4xl font-black">HISTÓRICO DE CONSULTAS</h2>

          {queries && queries.length > 0 ? (
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="card-brutal space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black">
                        {query.cnpj}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Período: {new Date(query.startDate).toLocaleDateString()} a{' '}
                        {new Date(query.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: <span className="font-bold">{(query.status || 'pending').toUpperCase()}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Chaves encontradas: <span className="font-bold">{query.totalKeysFound}</span>
                      </p>
                      {query.errorMessage && (
                        <p className="text-sm text-destructive mt-2">
                          Erro: {query.errorMessage}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/query/${query.id}`)}
                      className="btn-brutal-outline text-sm px-4 py-2"
                    >
                      DETALHES
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-brutal text-center py-12 space-y-4">
              <p className="text-lg font-bold">NENHUMA CONSULTA REALIZADA</p>
              <p className="text-sm text-muted-foreground">
                Realize sua primeira consulta acima
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

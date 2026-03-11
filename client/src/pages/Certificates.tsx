import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Certificates() {
  const [, navigate] = useLocation();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');

  const { data: certificates, isLoading, refetch } = trpc.certificate.list.useQuery();
  const uploadMutation = trpc.certificate.upload.useMutation();
  const deleteMutation = trpc.certificate.delete.useMutation();

  const handleUpload = async () => {
    if (!uploadingFile || !cnpj || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const base64 = content.split(',')[1] || content;

      try {
        await uploadMutation.mutateAsync({
          fileName: uploadingFile.name,
          fileContent: base64,
          cnpj,
          password,
        });
        toast.success('Certificado enviado com sucesso');
        setUploadingFile(null);
        setCnpj('');
        setPassword('');
        refetch();
      } catch (error) {
        toast.error('Erro ao enviar certificado');
      }
    };
    reader.readAsDataURL(uploadingFile);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este certificado?')) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Certificado deletado');
      refetch();
    } catch (error) {
      toast.error('Erro ao deletar certificado');
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
          <h1 className="text-3xl md:text-4xl font-black">CERTIFICADOS</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="container py-12 md:py-20 space-y-12">
        {/* Upload Section */}
        <section className="space-y-6">
          <h2 className="text-4xl font-black">NOVO CERTIFICADO</h2>
          
          <div className="card-brutal space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold">Arquivo (.pfx ou .p12)</label>
              <input
                type="file"
                accept=".pfx,.p12"
                onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
                className="w-full border-2 border-foreground p-4 font-mono text-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <label className="block text-sm font-bold">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-foreground p-4 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="btn-brutal w-full disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'ENVIANDO...' : 'ENVIAR CERTIFICADO'}
            </button>
          </div>
        </section>

        <div className="divider-brutal" />

        {/* Certificates List */}
        <section className="space-y-6">
          <h2 className="text-4xl font-black">MEUS CERTIFICADOS</h2>

          {isLoading ? (
            <div className="card-brutal text-center py-12">
              <p className="text-lg">Carregando...</p>
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="card-brutal space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black">{cert.certificateName}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        CNPJ: <span className="font-mono">{cert.cnpj}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: <span className="font-bold">{cert.isActive ? 'ATIVO' : 'INATIVO'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(cert.id)}
                      disabled={deleteMutation.isPending}
                      className="btn-brutal-outline text-sm px-4 py-2 disabled:opacity-50"
                    >
                      DELETAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-brutal text-center py-12 space-y-4">
              <p className="text-lg font-bold">NENHUM CERTIFICADO ENCONTRADO</p>
              <p className="text-sm text-muted-foreground">
                Envie seu primeiro certificado acima para começar
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

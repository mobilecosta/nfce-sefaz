import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Admin() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  const { data: users, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();
  const { data: logs } = trpc.admin.getAuditLogs.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  const toggleActiveMutation = trpc.admin.toggleUserActive.useMutation();

  const handleUpdateRole = async (userId: number, role: 'user' | 'admin') => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
      toast.success('Função do usuário atualizada');
      refetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar função');
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ userId, isActive: !isActive });
      toast.success(isActive ? 'Usuário desativado' : 'Usuário ativado');
      refetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
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
          <h1 className="text-3xl md:text-4xl font-black">ADMINISTRAÇÃO</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="container py-12 md:py-20 space-y-12">
        {/* Tabs */}
        <div className="flex gap-4 border-b-4 border-foreground pb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`text-xl font-black px-6 py-2 transition-colors ${
              activeTab === 'users'
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            USUÁRIOS
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`text-xl font-black px-6 py-2 transition-colors ${
              activeTab === 'logs'
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            LOGS DE AUDITORIA
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <section className="space-y-6">
            <h2 className="text-4xl font-black">GERENCIAR USUÁRIOS</h2>

            {users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="card-brutal space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black">{user.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Email: {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Função: <span className="font-bold">{user.role.toUpperCase()}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="font-bold">{user.isActive ? 'ATIVO' : 'INATIVO'}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cadastro: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as 'user' | 'admin')}
                          className="border-2 border-foreground p-2 text-sm font-mono"
                        >
                          <option value="user">USER</option>
                          <option value="admin">ADMIN</option>
                        </select>

                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`btn-brutal-outline text-sm px-4 py-2 ${
                            user.isActive ? 'bg-destructive text-background' : 'bg-foreground text-background'
                          }`}
                        >
                          {user.isActive ? 'DESATIVAR' : 'ATIVAR'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-brutal text-center py-12">
                <p className="text-lg font-bold">NENHUM USUÁRIO ENCONTRADO</p>
              </div>
            )}
          </section>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <section className="space-y-6">
            <h2 className="text-4xl font-black">LOGS DE AUDITORIA</h2>

            {logs && logs.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="card-brutal space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">{log.action.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          Usuário: {log.userId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tipo: {log.resourceType}
                        </p>
                        {log.cnpj && (
                          <p className="text-xs text-muted-foreground">
                            CNPJ: {log.cnpj}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        <p className={`text-xs font-bold mt-1 ${
                          (log.status || 'success') === 'success' ? 'text-green-700' :
                          (log.status || 'success') === 'error' ? 'text-destructive' :
                          'text-yellow-700'
                        }`}>
                          {(log.status || 'success').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-brutal text-center py-12">
                <p className="text-lg font-bold">NENHUM LOG ENCONTRADO</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

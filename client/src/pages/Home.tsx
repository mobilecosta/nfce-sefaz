import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-4 border-foreground py-8 px-6 md:px-12">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl md:text-5xl font-black tracking-tighter">
              NFC-e
            </div>
            <div className="hidden sm:block border-l-4 border-foreground pl-4">
              <p className="text-sm font-bold">SEFAZ-SP</p>
              <p className="text-xs text-muted-foreground">Consulta e Download</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="text-sm">
                  <p className="font-bold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="btn-brutal-outline text-sm px-4 py-2"
                >
                  Sair
                </button>
              </>
            ) : (
              <a href={getLoginUrl()} className="btn-brutal text-sm px-4 py-2">
                Entrar
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-20 md:py-32">
        {isAuthenticated ? (
          <DashboardContent user={user} navigate={navigate} />
        ) : (
          <LandingContent />
        )}
      </main>
    </div>
  );
}

function LandingContent() {
  return (
    <div className="space-y-20 md:space-y-32">
      {/* Hero */}
      <section className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-black leading-tight tracking-tighter">
            CONSULTA E<br />
            DOWNLOAD<br />
            AUTOMATIZADO
          </h1>
          <p className="text-xl md:text-2xl font-bold text-muted-foreground max-w-2xl">
            Integração direta com os WebServices da SEFAZ-SP para gestão completa de Notas Fiscais de Consumidor Eletrônicas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <a href={getLoginUrl()} className="btn-brutal">
            Começar Agora
          </a>
          <button className="btn-brutal-outline">
            Saiba Mais
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className="divider-brutal" />

      {/* Features */}
      <section className="space-y-12">
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
          FUNCIONALIDADES
        </h2>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {[
            {
              title: "Certificado Digital",
              desc: "Upload e gerenciamento seguro de certificados e-CNPJ com armazenamento em S3"
            },
            {
              title: "Consulta de Chaves",
              desc: "Listagem de chaves de acesso de NFC-e por período e CNPJ"
            },
            {
              title: "Download de XMLs",
              desc: "Download individual ou em lote de arquivos XML das notas fiscais"
            },
            {
              title: "Armazenamento Seguro",
              desc: "Backup automático em S3 com histórico completo de operações"
            },
            {
              title: "Painel Administrativo",
              desc: "Gerenciamento de usuários e visualização de logs de auditoria"
            },
            {
              title: "Relatórios",
              desc: "Histórico detalhado de consultas, downloads e metadados para auditoria"
            },
          ].map((feature, idx) => (
            <div key={idx} className="card-brutal space-y-4">
              <h3 className="text-2xl font-black">[{feature.title}]</h3>
              <p className="text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="divider-brutal" />

      {/* CTA */}
      <section className="bg-foreground text-background p-12 md:p-20 space-y-8">
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
          PRONTO PARA<br />
          COMEÇAR?
        </h2>
        <p className="text-lg md:text-xl max-w-2xl">
          Acesse agora a plataforma e comece a consultar suas NFC-e com segurança e eficiência.
        </p>
        <a href={getLoginUrl()} className="btn-brutal bg-background text-foreground inline-block">
          Acessar Plataforma
        </a>
      </section>
    </div>
  );
}

function DashboardContent({ user, navigate }: any) {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter">
          BEM-VINDO,<br />
          {user?.name?.split(' ')[0]?.toUpperCase()}
        </h1>
        <p className="text-lg text-muted-foreground">
          Gerencie suas consultas e downloads de NFC-e da SEFAZ-SP
        </p>
      </div>

      <div className="divider-brutal" />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-8">
        <button
          onClick={() => navigate('/certificates')}
          className="card-brutal space-y-4 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
        >
          <h3 className="text-2xl font-black">CERTIFICADOS</h3>
          <p className="text-sm">Gerenciar certificados digitais</p>
        </button>

        <button
          onClick={() => navigate('/query')}
          className="card-brutal space-y-4 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
        >
          <h3 className="text-2xl font-black">NOVA CONSULTA</h3>
          <p className="text-sm">Consultar NFC-e por período</p>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="card-brutal space-y-4 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
        >
          <h3 className="text-2xl font-black">HISTÓRICO</h3>
          <p className="text-sm">Visualizar consultas anteriores</p>
        </button>
      </div>

      {/* Admin Section */}
      {user?.role === 'admin' && (
        <>
          <div className="divider-brutal" />
          <div className="space-y-4">
            <h2 className="text-4xl font-black">ADMINISTRAÇÃO</h2>
            <button
              onClick={() => navigate('/admin')}
              className="card-brutal space-y-4 hover:bg-foreground hover:text-background transition-colors cursor-pointer w-full"
            >
              <h3 className="text-2xl font-black">PAINEL ADMIN</h3>
              <p className="text-sm">Gerenciar usuários e visualizar logs</p>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

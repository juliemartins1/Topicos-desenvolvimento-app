import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Sessao, Usuario } from '@/models/usuario';
import { api, armazenamentoSessao, definirAoExpirar, ApiError } from '@/services/api';

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  sessaoExpirada: boolean;
  carregando: boolean;
  restaurando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [restaurando, setRestaurando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const guardada = await armazenamentoSessao.ler();
        if (!guardada) return;
        let sessaoSalva: Sessao;
        try { sessaoSalva = JSON.parse(guardada) as Sessao; }
        catch { await armazenamentoSessao.apagar(); return; }
        try {
          const usuario = await api.perfil(sessaoSalva.token);
          if (ativo) setSessao({ token: sessaoSalva.token, usuario });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) await armazenamentoSessao.apagar();
          // Se o servidor estiver fora do ar (status 0), preserva o token para tentar de novo.
          // A sessão não é considerada autenticada até o servidor confirmar.
        }
      } finally { if (ativo) setRestaurando(false); }
    })();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    definirAoExpirar(() => {
      setSessao(null);
      setSessaoExpirada(true);
      void armazenamentoSessao.apagar();
    });
    return () => definirAoExpirar(null);
  }, []);

  async function entrar(email: string, senha: string) {
    setCarregando(true); setSessaoExpirada(false);
    try { const nova = await api.login(email, senha); await armazenamentoSessao.salvar(nova); setSessao(nova); }
    finally { setCarregando(false); }
  }
  async function cadastrar(nome: string, email: string, senha: string) {
    setCarregando(true); setSessaoExpirada(false);
    try { const nova = await api.cadastrar(nome, email, senha); await armazenamentoSessao.salvar(nova); setSessao(nova); }
    finally { setCarregando(false); }
  }
  async function sair() {
    const atual = sessao;
    setSessao(null); setSessaoExpirada(false);
    await armazenamentoSessao.apagar();
    if (atual) await api.sair(atual.token).catch(() => {});
  }
  return <AuthContext value={{ usuario: sessao?.usuario ?? null, token: sessao?.token ?? null, sessaoExpirada, carregando, restaurando, entrar, cadastrar, sair }}>{children}</AuthContext>;
}
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth() só pode ser usado dentro de <AuthProvider>.');
  return contexto;
}

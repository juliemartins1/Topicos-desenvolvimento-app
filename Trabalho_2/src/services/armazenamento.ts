import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Sessao } from '@/models/usuario';

// ARMAZENAMENTO DA SESSÃO — src/services/armazenamento.ts
//
// Único lugar que conhece o AsyncStorage. Guarda a sessão (token + usuário)
// no aparelho para ela sobreviver a um reload do app.
//
// ATENÇÃO: o AsyncStorage NÃO é criptografado. Em um app real o token iria
// para o expo-secure-store; aqui usamos o AsyncStorage porque também
// funciona na web.
//
// Falha de armazenamento nunca deve derrubar o login: se não der para
// gravar, o app funciona normalmente, só não lembra da sessão no reload.

const CHAVE = 'aula06:sessao';

// O que vem do disco é `unknown`: confere o formato antes de confiar.
function ehSessao(valor: unknown): valor is Sessao {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'token' in valor &&
    typeof valor.token === 'string' &&
    'usuario' in valor
  );
}

export async function salvarSessao(sessao: Sessao): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    // sem persistência; a sessão em memória continua valendo
  }
}

export async function lerSessao(): Promise<Sessao | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dados: unknown = JSON.parse(bruto);
    return ehSessao(dados) ? dados : null;
  } catch {
    return null;
  }
}

export async function apagarSessao(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE);
  } catch {
    // idem
  }
}

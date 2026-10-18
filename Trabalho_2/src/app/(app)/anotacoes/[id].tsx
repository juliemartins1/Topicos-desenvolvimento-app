import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/header';
import { MensagemErro } from '@/components/mensagem-erro';
import { TelaDeEspera } from '@/components/tela-de-espera';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import type { Anotacao } from '@/models/usuario';
import { api, ApiError } from '@/services/api';
export default function AnotacaoDetalheScreen() {
 const { id } = useLocalSearchParams<{ id: string }>(); const { token } = useAuth();
 const [anotacao,setAnotacao] = useState<Anotacao|null>(null); const [carregando,setCarregando] = useState(true); const [erro,setErro] = useState<string|null>(null);
 useEffect(()=>{ let ativo=true; (async()=>{ try { const dado=await api.buscarAnotacao(token,id); if(ativo)setAnotacao(dado); } catch(e) { if(ativo)setErro(e instanceof ApiError ? (e.status===404 ? 'Anotação não encontrada ou você não tem acesso a ela.' : e.message) : 'Não foi possível carregar a anotação.'); } finally {if(ativo)setCarregando(false);} })(); return ()=>{ativo=false;}; },[id,token]);
 if(carregando) return <TelaDeEspera mensagem="Carregando anotação…"/>;
 return <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}><Header title="Detalhes da anotação" subtitle={`Identificador: ${id}`}/><MensagemErro>{erro}</MensagemErro>{anotacao ? <View style={styles.cartao}><Text style={styles.texto}>{anotacao.texto}</Text><Text style={styles.data}>{new Date(anotacao.criadaEm).toLocaleDateString('pt-BR')} às {new Date(anotacao.criadaEm).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</Text></View>:null}</ScrollView>;
}
const styles=StyleSheet.create({tela:{flex:1,backgroundColor:Colors.background},conteudo:{padding:Spacing.lg,gap:Spacing.md},cartao:{padding:Spacing.lg,backgroundColor:Colors.surface,borderColor:Colors.border,borderWidth:1,borderRadius:Spacing.sm,gap:Spacing.md},texto:{fontSize:18,color:Colors.text},data:{fontSize:13,color:Colors.textSecondary}});

import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { Header } from '@/components/header';
import { MensagemErro } from '@/components/mensagem-erro';
import { TelaDeEspera } from '@/components/tela-de-espera';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import type { Anotacao } from '@/models/usuario';
import { api, ApiError } from '@/services/api';
export default function ModeracaoScreen(){ const {token}=useAuth(); const [itens,setItens]=useState<Anotacao[]>([]); const [carregando,setCarregando]=useState(true); const [erro,setErro]=useState<string|null>(null);
 useEffect(()=>{let ativo=true;(async()=>{try{const dados=await api.listarAnotacoesModeracao(token);if(ativo)setItens(dados);}catch(e){if(ativo)setErro(e instanceof ApiError?e.message:'Não foi possível carregar.');}finally{if(ativo)setCarregando(false);}})();return()=>{ativo=false;};},[token]);
 if(carregando)return <TelaDeEspera mensagem="Carregando anotações para moderação…"/>;
 return <FlatList style={styles.tela} contentContainerStyle={styles.conteudo} data={itens} keyExtractor={i=>i.id} ListHeaderComponent={<><Header title="Moderação" subtitle="Anotações de todos os usuários"/><MensagemErro>{erro}</MensagemErro></>} ListEmptyComponent={<EmptyState titulo="Nenhuma anotação"/>} ItemSeparatorComponent={()=> <View style={{height:Spacing.sm}}/>} renderItem={({item})=><View style={styles.item}><Text style={styles.autor}>Autor: {item.autor ?? 'Desconhecido'}</Text><Text style={styles.texto}>{item.texto}</Text><Text style={styles.data}>{new Date(item.criadaEm).toLocaleString('pt-BR')}</Text></View>}/>;
}
const styles=StyleSheet.create({tela:{flex:1,backgroundColor:Colors.background},conteudo:{padding:Spacing.lg},item:{padding:Spacing.md,borderRadius:Spacing.sm,borderWidth:1,borderColor:Colors.border,backgroundColor:Colors.surface,gap:Spacing.xs},autor:{fontWeight:'700',color:Colors.text},texto:{fontSize:16,color:Colors.text},data:{fontSize:12,color:Colors.textSecondary}});

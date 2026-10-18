import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
export function TelaDeEspera({ mensagem = 'Aguarde um instante…' }: { mensagem?: string }) {
  return <View style={styles.container}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.texto}>{mensagem}</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.background }, texto: { color: Colors.text, fontSize: 16, textAlign: 'center' } });

import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { Anotacao } from '@/models/usuario';

interface AnotacaoItemProps {
  anotacao: Anotacao;
  onPress?: () => void;
}

export function AnotacaoItem({ anotacao, onPress }: AnotacaoItemProps) {
  const data = new Date(anotacao.criadaEm);

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={styles.texto}>{anotacao.texto}</Text>
      <Text style={styles.meta}>
        {data.toLocaleDateString('pt-BR')} às{' '}
        {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  texto: {
    fontSize: 16,
    color: Colors.text,
  },
  meta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

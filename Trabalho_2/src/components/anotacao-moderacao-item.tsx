import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { AnotacaoComAutor } from '@/models/usuario';
import { formatarData } from '@/utils/formatar-data';

interface AnotacaoModeracaoItemProps {
  anotacao: AnotacaoComAutor;
}

// Item da lista de moderação: como o AnotacaoItem, mas mostra QUEM escreveu.
export function AnotacaoModeracaoItem({ anotacao }: AnotacaoModeracaoItemProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.autor}>{anotacao.autor}</Text>
      <Text style={styles.texto}>{anotacao.texto}</Text>
      <Text style={styles.meta}>{formatarData(anotacao.criadaEm)}</Text>
    </View>
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
  autor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
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

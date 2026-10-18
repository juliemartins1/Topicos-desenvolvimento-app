import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { Anotacao } from '@/models/usuario';
import { formatarData } from '@/utils/formatar-data';

interface AnotacaoDetalheProps {
  anotacao: Anotacao;
}

// Estado de SUCESSO da tela /anotacoes/[id]: texto inteiro e data de criação.
export function AnotacaoDetalhe({ anotacao }: AnotacaoDetalheProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.texto} selectable>
        {anotacao.texto}
      </Text>
      <Text style={styles.meta}>Criada em {formatarData(anotacao.criadaEm)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  texto: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

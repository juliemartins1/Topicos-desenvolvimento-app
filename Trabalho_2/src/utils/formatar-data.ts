// Formata uma data ISO do servidor como "29/09/2026 às 14:32".
export function formatarData(iso: string): string {
  const data = new Date(iso);
  const dia = data.toLocaleDateString('pt-BR');
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

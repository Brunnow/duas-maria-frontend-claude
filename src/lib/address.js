/*
 * Formata um endereço em linhas para exibição. Tolera tanto o endereço
 * da conta (pincode, buildingName) quanto o snapshot do pedido
 * (cep, complement). Campos ausentes (endereços legados) são omitidos.
 */
export function addressLines(a) {
  if (!a) return [];
  const cep = a.pincode || a.cep;
  const complement = a.buildingName || a.complement;
  const lines = [];

  const who = [a.recipientName, a.phone].filter(Boolean).join(' · ');
  if (who) lines.push(who);

  const streetLine = [a.street, a.number].filter(Boolean).join(', ');
  const withComplement = complement ? `${streetLine} - ${complement}` : streetLine;
  if (withComplement) lines.push(withComplement);

  const cityUf = [a.city, a.state].filter(Boolean).join('/');
  const local = [a.neighborhood, cityUf].filter(Boolean).join(' - ');
  if (local) lines.push(local);

  if (cep) lines.push(`CEP ${cep}`);
  return lines;
}

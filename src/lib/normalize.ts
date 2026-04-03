/**
 * Normaliza un texto eliminando acentos y convirtiéndolo a minúsculas.
 * Centraliza la lógica que estaba duplicada en múltiples componentes.
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/**
 * Filtra una lista de objetos buscando el término en los campos indicados.
 * Ignora acentos y mayúsculas en la comparación.
 */
export function normalizeSearch<T extends Record<string, any>>(
  list: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  const normalized = normalizeText(search);
  if (!normalized) return list;
  return list.filter(item =>
    fields.some(field => {
      const val = item[field];
      return typeof val === "string" && normalizeText(val).includes(normalized);
    })
  );
}

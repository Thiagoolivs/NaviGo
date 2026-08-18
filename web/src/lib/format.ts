/** Utilitários de formatação e composição de classes. */

export const cn = (...v: (string | false | null | undefined)[]) =>
  v.filter(Boolean).join(' ')

export const brl = (v: string | number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

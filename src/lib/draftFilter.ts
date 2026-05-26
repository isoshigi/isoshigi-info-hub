export function filterDrafts({ data }: { data: { draft: boolean } }) {
  return import.meta.env.DEV || !data.draft;
}

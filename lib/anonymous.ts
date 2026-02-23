const ANONYMOUS_CATEGORY_IDS = ["social-anonymous-confessions"];

export function isAnonymousCategory(categoryId: string): boolean {
  return (
    ANONYMOUS_CATEGORY_IDS.includes(categoryId) ||
    categoryId.endsWith("-anonymous-confessions")
  );
}

export function getAnonymousDisplayName(authorId: string): string {
  let h = 0;
  for (let i = 0; i < authorId.length; i++) {
    h = ((h << 5) - h) + authorId.charCodeAt(i) | 0;
  }
  const hex = Math.abs(h).toString(16).slice(0, 6);
  return `Anon#${hex}`;
}

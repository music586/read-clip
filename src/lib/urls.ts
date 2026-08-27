export function withBase(path: string, base = import.meta.env.BASE_URL || '/'): string {
  if (!path.startsWith('/')) {
    throw new Error(`Internal paths must start with "/": ${path}`);
  }

  const normalizedBase = base === '/' ? '' : `/${base.replace(/^\/+|\/+$/g, '')}`;
  return `${normalizedBase}${path}` || '/';
}

const externalUrlPattern = /^(?:https?:)?\/\//i;

function visit(node) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'element' && node.tagName === 'a') {
    const href = node.properties?.href;
    if (typeof href === 'string' && externalUrlPattern.test(href)) {
      node.properties ??= {};
      node.properties.target = '_blank';

      const rel = Array.isArray(node.properties.rel)
        ? node.properties.rel
        : typeof node.properties.rel === 'string'
          ? node.properties.rel.split(/\s+/)
          : [];

      node.properties.rel = [...new Set([...rel, 'noopener', 'noreferrer'])];
    }
  }

  if (Array.isArray(node.children)) {
    node.children.forEach(visit);
  }
}

export function rehypeExternalLinks() {
  return (tree) => visit(tree);
}

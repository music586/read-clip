export function removeFirstHeading(tree) {
  if (!tree || !Array.isArray(tree.children)) return;
  const index = tree.children.findIndex((node) => node?.type === 'heading');
  if (index >= 0) tree.children.splice(index, 1);
}

export default function remarkRemoveFirstHeading() {
  return removeFirstHeading;
}

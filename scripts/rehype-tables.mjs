export function rehypeTables() {
  return function visit(node) {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.map((child) => {
      if (child.type === 'element' && child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['table-scroll'],
            tabIndex: 0,
            role: 'region',
            ariaLabel: '表格，可横向滚动',
          },
          children: [child],
        };
      }
      visit(child);
      return child;
    });
  };
}

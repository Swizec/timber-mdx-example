import { visit } from 'unist-util-visit';

function dot(color) {
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: [`code-window-dot`, `code-window-dot--${color}`] },
    children: [],
  };
}

const titlebar = {
  type: 'element',
  tagName: 'div',
  properties: { className: ['code-window-titlebar'] },
  children: [dot('red'), dot('yellow'), dot('green')],
};

export function rehypeCodeWindow() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !node.properties?.className?.includes('shiki')) return;
      if (!parent || index == null) return;

      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-window'] },
        children: [titlebar, node],
      };

      parent.children[index] = wrapper;
    });
  };
}

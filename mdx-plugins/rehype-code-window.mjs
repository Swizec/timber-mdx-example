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

export const codeWindowTransformer = {
  name: 'code-window',
  root(root) {
    const pre = root.children[0];
    root.children = [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-window'] },
        children: [titlebar, pre],
      },
    ];
  },
};

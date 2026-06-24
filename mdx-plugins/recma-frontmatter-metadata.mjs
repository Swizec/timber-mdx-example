import path from 'node:path';
import { toPosix, importSource } from './helpers.mjs';

function routePathForFile(filePath, appDir) {
  const appPath = toPosix(new URL(appDir, import.meta.url).pathname);
  const relativePath = path.posix.relative(appPath, toPosix(filePath));
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.pop();

  if (!fileName) return '/';

  if (!/^page\.mdx?$/.test(fileName) && !/^index\.mdx?$/.test(fileName)) {
    parts.push(fileName.replace(/\.mdx?$/, ''));
  }

  const routeParts = parts.filter((part) => !part.startsWith('(') && !part.startsWith('@'));
  return `/${routeParts.join('/')}`.replace(/\/$/, '') || '/';
}

function hasMetadataExport(tree) {
  return tree.body.some((node) => {
    if (node.type !== 'ExportNamedDeclaration') return false;

    if (node.declaration?.type === 'VariableDeclaration') {
      return node.declaration.declarations.some(
        (declaration) => declaration.id?.type === 'Identifier' && declaration.id.name === 'metadata'
      );
    }

    return node.specifiers?.some((specifier) => specifier.exported?.name === 'metadata');
  });
}

function hasFrontmatterExport(tree) {
  return tree.body.some((node) => {
    if (node.type !== 'ExportNamedDeclaration') return false;
    if (node.declaration?.type !== 'VariableDeclaration') return false;

    return node.declaration.declarations.some(
      (declaration) => declaration.id?.type === 'Identifier' && declaration.id.name === 'frontmatter'
    );
  });
}

function metadataImport(source) {
  return {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: 'metadataFromFrontmatter' },
        local: { type: 'Identifier', name: 'metadataFromFrontmatter' },
      },
    ],
    source: { type: 'Literal', value: source, raw: JSON.stringify(source) },
  };
}

function metadataExport(routePath) {
  return {
    type: 'ExportNamedDeclaration',
    declaration: {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'metadata' },
          init: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'metadataFromFrontmatter' },
            arguments: [
              { type: 'Identifier', name: 'frontmatter' },
              { type: 'Literal', value: routePath, raw: JSON.stringify(routePath) },
            ],
            optional: false,
          },
        },
      ],
    },
    specifiers: [],
    source: null,
  };
}

export function recmaFrontmatterMetadata(options = {}) {
  return (tree, file) => {
    if (!file.path) return;
    if (!file.data.swizecHasFrontmatter) return;
    if (!hasFrontmatterExport(tree) || hasMetadataExport(tree)) return;

    // Paths are relative to this file (mdx-plugins/), so ../app/ resolves to app/
    const metadataFile = new URL(options.metadataModule ?? '../app/mdx-metadata.ts', import.meta.url)
      .pathname;
    const source = importSource(file.path, metadataFile);
    const routePath = routePathForFile(file.path, options.appDir ?? '../app/');

    tree.body.unshift(metadataImport(source));
    tree.body.push(metadataExport(routePath));
  };
}

#!/usr/bin/env node
// Pure build driver: compiles all .lume modules in src/ -> dist/*.mjs and src/web/*.lume -> public/*.js
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_LUME_DIR = 'D:/lume/src';

let tokenize;
let parse;
let transpile;

if (existsSync(join(LOCAL_LUME_DIR, 'lexer.js'))) {
  ({ tokenize } = await import(pathToFileURL(join(LOCAL_LUME_DIR, 'lexer.js')).href));
  ({ parse } = await import(pathToFileURL(join(LOCAL_LUME_DIR, 'parser.js')).href));
  ({ transpile } = await import(pathToFileURL(join(LOCAL_LUME_DIR, 'transpiler.js')).href));
} else {
  ({ tokenize } = await import('lume-lang/lexer'));
  ({ parse } = await import('lume-lang/parser'));
  ({ transpile } = await import('lume-lang/transpiler'));
}

function compileFile(srcPath, outPath, isServerModule) {
  const source = readFileSync(srcPath, 'utf8');
  const tokens = tokenize(source, basename(srcPath));
  const ast = parse(tokens, basename(srcPath));
  let js = transpile(ast, basename(srcPath));
  if (isServerModule) {
    js = js.replace(/(from\s+["']\.\/(?!shim\/)[^"']+)\.(?:lume|js)(["'])/g, '$1.mjs$2');
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, js, 'utf8');
  console.log(`  [lume] ${basename(srcPath)} -> ${outPath.replace(ROOT, '.')}`);
}

mkdirSync(join(ROOT, 'dist', 'shim'), { recursive: true });
copyFileSync(
  join(ROOT, 'src', 'shim', 'lume-interop.mjs'),
  join(ROOT, 'dist', 'shim', 'lume-interop.mjs'),
);

for (const name of readdirSync(join(ROOT, 'src'))) {
  if (name.endsWith('.lume')) {
    compileFile(join(ROOT, 'src', name), join(ROOT, 'dist', name.replace(/\.lume$/, '.mjs')), true);
  }
}

const webSrc = join(ROOT, 'src', 'web');
if (existsSync(webSrc)) {
  for (const name of readdirSync(webSrc)) {
    if (name.endsWith('.lume')) {
      compileFile(join(webSrc, name), join(ROOT, 'public', name.replace(/\.lume$/, '.js')), false);
    }
  }
}

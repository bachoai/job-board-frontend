import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

// The project's TypeScript 7 package has no transpileModule. These API modules
// use erasable types and named imports, so Node 24 can load them with explicit mocks.
export function loadApi(relativePath, mocks) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const names = [];
  const js = stripTypeScriptTypes(source)
    .replace(/import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/g,
      (_, bindings, specifier) => `const {${bindings}} = require(${JSON.stringify(specifier)});`)
    .replace(/export\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/g,
      (_, bindings, specifier) => bindings.split(',').map(name => `exports.${name.trim()} = require(${JSON.stringify(specifier)}).${name.trim()};`).join('\n'))
    .replace(/export\s+(const|function|class)\s+(\w+)/g, (_, kind, name) => {
      names.push(name); return `${kind} ${name}`;
    });
  const exports = {};
  vm.runInNewContext(`${js}\nObject.assign(exports, {${names.join(',')}});`, {
    exports, URLSearchParams,
    require(specifier) {
      const entry = Object.entries(mocks).find(([suffix]) => specifier.endsWith(suffix));
      if (!entry) throw new Error(`Unmocked import: ${specifier}`);
      return entry[1];
    },
  });
  return exports;
}

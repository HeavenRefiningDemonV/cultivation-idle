export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    if (!isRelative) throw error;

    const candidates = [];
    const hasKnownExtension = /\.(mjs|cjs|js|ts|tsx|json)$/.test(specifier);

    if (!hasKnownExtension) {
      candidates.push(
        `${specifier}.ts`,
        `${specifier}.tsx`,
        `${specifier}.js`,
        `${specifier}/index.ts`,
        `${specifier}/index.tsx`,
        `${specifier}/index.js`,
      );
    }

    if (specifier.endsWith('.js')) {
      candidates.push(
        specifier.slice(0, -3) + '.ts',
        specifier.slice(0, -3) + '.tsx',
      );
    }

    for (const candidate of candidates) {
      try {
        return await defaultResolve(candidate, context, defaultResolve);
      } catch {
        // continue
      }
    }

    throw error;
  }
}

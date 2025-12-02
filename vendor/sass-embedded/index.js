export async function compileStringAsync(source, options = {}) {
  return compileResult(source, options);
}

export function compileString(source, options = {}) {
  return compileResult(source, options);
}

export async function initAsyncCompiler() {
  return {
    compileStringAsync,
    compileString,
    dispose() {},
  };
}

function compileResult(source, options) {
  const css = typeof source === 'string' ? source : '';
  return {
    css,
    sourceMap: options.sourceMap ? { version: 3, sources: [], mappings: '' } : null,
    loadedUrls: [],
    options,
  };
}

export default {
  compileStringAsync,
  compileString,
  initAsyncCompiler,
};

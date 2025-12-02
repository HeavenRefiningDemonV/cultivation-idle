const fs = require('fs');
function renderSync(options = {}) {
  const cssSource = options.data ?? (options.file ? fs.readFileSync(options.file, 'utf8') : '');
  return { css: Buffer.from(cssSource), stats: {}, map: Buffer.from('') };
}

function compileString(source = '', _options = {}) {
  return { css: { text: source }, sourceMap: '' };
}

async function initAsyncCompiler() {
  return {
    async compileStringAsync(source = '', options = {}) {
      return {
        css: typeof source === 'string' ? source : '',
        sourceMap: options.sourceMap ? {} : null,
        loadedUrls: options.url ? [options.url] : [],
      };
    },
    async dispose() {
      return undefined;
    },
  };
}

module.exports = {
  renderSync,
  compileString,
  initAsyncCompiler,
  info: 'sass stub 1.80.0',
};

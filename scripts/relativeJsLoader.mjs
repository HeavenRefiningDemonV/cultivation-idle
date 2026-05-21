export async function resolve(specifier, context, defaultResolve) {
  if (/\.(?:css|scss)$/.test(specifier)) {
    return {
      url: 'data:text/javascript,export%20default%20%7B%7D%3B',
      shortCircuit: true,
    };
  }

  if (/\.(?:avif|gif|jpe?g|png|svg|webp)$/.test(specifier)) {
    return {
      url: 'data:text/javascript,export%20default%20%22%22%3B',
      shortCircuit: true,
    };
  }

  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (
      error?.code === 'ERR_MODULE_NOT_FOUND' &&
      (specifier.startsWith('./') || specifier.startsWith('../'))
    ) {
      if (specifier.endsWith('.js')) {
        return defaultResolve(`${specifier.slice(0, -3)}.ts`, context, defaultResolve);
      }

      if (!specifier.endsWith('.json') && !specifier.endsWith('.node')) {
        return defaultResolve(`${specifier}.js`, context, defaultResolve);
      }
    }

    throw error;
  }
}

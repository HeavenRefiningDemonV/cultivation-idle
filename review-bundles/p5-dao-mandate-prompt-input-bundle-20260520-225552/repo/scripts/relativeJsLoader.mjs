export async function resolve(specifier, context, defaultResolve) {
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

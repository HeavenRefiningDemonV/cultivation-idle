function toValue(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(toValue).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, truthy]) => Boolean(truthy))
      .map(([key]) => key)
      .join(' ');
  }
  return '';
}

export default function classNames(...classes) {
  return classes.map(toValue).filter(Boolean).join(' ');
}

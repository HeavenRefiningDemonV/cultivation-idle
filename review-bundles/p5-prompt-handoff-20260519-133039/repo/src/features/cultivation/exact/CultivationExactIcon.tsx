export interface CultivationExactIconProps {
  iconKey: string;
  className?: string;
  title?: string;
}

const ICON_PATHS: Record<string, string[]> = {
  realm: [
    'M12 2.8 19.2 7v8.4L12 19.6 4.8 15.4V7L12 2.8Z',
    'M12 6.2v9.2M7.9 8.4l8.2 4.8M16.1 8.4l-8.2 4.8',
  ],
  qi: [
    'M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z',
    'M7.4 12.1c3.4-4.6 8.8-3.4 9.3 0 .5 3.2-4.9 4.5-8.7 1.6',
  ],
  rate: [
    'M12 4.2v15.6M5.4 15.8c2.1-1.2 3.3-3.2 3.5-6M18.6 8.2c-2.1 1.2-3.3 3.2-3.5 6',
    'M8.8 6.4 12 3.8l3.2 2.6M15.2 17.6 12 20.2l-3.2-2.6',
  ],
  stability: [
    'M12 3.5 18.6 7v6.4c0 3.2-2.4 5.5-6.6 7.1-4.2-1.6-6.6-3.9-6.6-7.1V7L12 3.5Z',
    'M9 12.1 11.1 14 15.4 9.7',
  ],
  foreground: [
    'M12 4.2a4.2 4.2 0 0 1 4.2 4.2c0 4.5-4.2 11.4-4.2 11.4S7.8 12.9 7.8 8.4A4.2 4.2 0 0 1 12 4.2Z',
    'M10.3 8.5h3.4M10.3 11h3.4',
  ],
  mountain: [
    'M3.8 18.4 9.1 7.2l3.2 6.1 2.1-3.9 5.8 9H3.8Z',
    'M8.3 10.2 10 11.8l1.1-1',
  ],
  gate: [
    'M5.2 19V6.7h13.6V19',
    'M8.2 19v-7.2h7.6V19M4 6.7h16',
  ],
  meditate: [
    'M12 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z',
    'M6.2 19c1.6-3.2 3.5-4.8 5.8-4.8s4.2 1.6 5.8 4.8M8.4 16.8h7.2',
  ],
  path: [
    'M5.2 18.8c4.6-1.4 7.2-4 7.8-7.8.4-2.7 1.7-4.6 4-5.8',
    'M15.1 4.6h4.3v4.3M5.1 11.6h4.2M9.3 15.4h4.2',
  ],
  flame: [
    'M12.6 3.6c2.9 2.7 4.8 5.5 4.8 8.8a5.4 5.4 0 0 1-10.8 0c0-2.6 1.6-4.7 3.6-6.2-.2 2 .5 3.3 2 4 1.3-1.8 1.5-3.9.4-6.6Z',
  ],
  lotus: [
    'M12 18.6c-3.5-1.1-5.8-3.1-6.9-6.1 2.8-.3 5 .7 6.9 3 1.9-2.3 4.1-3.3 6.9-3-1.1 3-3.4 5-6.9 6.1Z',
    'M12 15.5c-1.8-2.5-1.8-5.2 0-8.1 1.8 2.9 1.8 5.6 0 8.1Z',
  ],
  scroll: [
    'M7.2 5.2h9.6v13.6H7.2V5.2Z',
    'M9.4 8.2h5.2M9.4 11.2h5.2M9.4 14.2h3.4',
  ],
  seal: [
    'M12 3.8 18.1 7.3v7.4L12 20.2l-6.1-5.5V7.3L12 3.8Z',
    'M9.2 9.2h5.6v5.6H9.2V9.2Z',
  ],
};

export function CultivationExactIcon({ iconKey, className, title }: CultivationExactIconProps) {
  const paths = ICON_PATHS[iconKey] ?? ICON_PATHS.seal;
  const labelled = Boolean(title);

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role={labelled ? 'img' : 'presentation'}
      aria-hidden={labelled ? undefined : 'true'}
      data-icon-key={iconKey}
    >
      {title ? <title>{title}</title> : null}
      {paths.map((path, index) => (
        <path key={`${iconKey}-${index}`} d={path} />
      ))}
    </svg>
  );
}


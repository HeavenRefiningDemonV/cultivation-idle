import type { SVGProps } from 'react';

export type IconComponent = (props: SVGProps<SVGSVGElement> & { title?: string }) => JSX.Element;

type InkIconProps = SVGProps<SVGSVGElement> & { title?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const renderTitle = (title?: string) => (title ? <title>{title}</title> : null);

export const InkHeartIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path
      {...strokeProps}
      d="M12 20.5s-7-4.6-7-9.4A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 3.1c0 4.8-7 9.4-7 9.4Z"
    />
  </svg>
);

export const InkShieldIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="M12 3.5 19 6v6.2c0 4.8-3.3 7.8-7 9.8-3.7-2-7-5-7-9.8V6l7-2.5Z" />
  </svg>
);

export const InkBoltIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="M13.5 2.5 6 13.5h5l-1 8 8-11h-5l.5-8Z" />
  </svg>
);

export const InkSwirlIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path
      {...strokeProps}
      d="M12 4a8 8 0 1 0 8 8c0-2.8-2.2-5-5-5-2 0-3.5 1.5-3.5 3.3 0 1.4 1.1 2.5 2.5 2.5"
    />
  </svg>
);

export const InkLockIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <rect {...strokeProps} x="5" y="11" width="14" height="9" rx="2" />
    <path {...strokeProps} d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const InkRefreshIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="M20 12a8 8 0 1 1-2.2-5.6" />
    <path {...strokeProps} d="M20 4.5v4.5h-4.5" />
  </svg>
);

export const InkWarningIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="M12 4 3.5 19.5h17L12 4Z" />
    <path {...strokeProps} d="M12 9v4" />
    <path {...strokeProps} d="M12 17.5h0.01" />
  </svg>
);

export const InkWipIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <rect {...strokeProps} x="4" y="7" width="16" height="6" rx="1" />
    <path {...strokeProps} d="M6 9.5 9.5 13" />
    <path {...strokeProps} d="M10 9.5 13.5 13" />
    <path {...strokeProps} d="M14 9.5 17.5 13" />
    <path {...strokeProps} d="M3.5 17.5h17" />
  </svg>
);

export const InkBurstIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path
      {...strokeProps}
      d="m12 3 2.2 4.4L19 9l-4.4 2 1.6 4.6L12 13l-4.2 2.6L9.4 11 5 9l4.8-1.6L12 3Z"
    />
  </svg>
);

export const InkSparklesIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="m12 4 1.4 3.1L16.5 8l-3.1 1.4L12 12.5l-1.4-3.1L7.5 8l3.1-.9L12 4Z" />
    <path {...strokeProps} d="m18 14 1 2.2 2.2 1-2.2 1L18 20l-1-1.8-2.2-1L17 16.2 18 14Z" />
  </svg>
);

export const InkCheckIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="M5 12.5 9.5 17 19 7.5" />
  </svg>
);

export const InkXIcon: IconComponent = ({ title, ...props }: InkIconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : true} {...props}>
    {renderTitle(title)}
    <path {...strokeProps} d="m6 6 12 12" />
    <path {...strokeProps} d="m18 6-12 12" />
  </svg>
);

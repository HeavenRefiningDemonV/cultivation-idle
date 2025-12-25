declare module 'react' {
  export const useState: any;
  export const useEffect: any;
  export const useMemo: any;
  export const useCallback: any;
  export const useRef: any;
  export const Fragment: any;
  export type FC<P = any> = (props: P & { children?: any }) => any;
  const React: any;
  export default React;
}

declare module 'react-dom' {
  export const createRoot: any;
  const ReactDOM: any;
  export default ReactDOM;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react/jsx-dev-runtime' {
  export const jsxDEV: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'zustand' {
  export type StateCreator<T> = (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T;
  export type StoreApi<T> = {
    getState: () => T;
    setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  };
  export default function create<T>(creator: StateCreator<T>): ((selector?: (state: T) => any) => any) & StoreApi<T>;
}

declare module 'zustand/middleware/immer' {
  import type { StateCreator } from 'zustand';
  export function immer<T>(creator: StateCreator<T>): StateCreator<T>;
  export default immer;
}

declare module '@headlessui/react';
declare module 'framer-motion';
declare module 'react-spring';
declare module '@floating-ui/react';
declare module '@floating-ui/react-dom';
declare module 'lucide-react';

export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassDictionary
  | ClassArray;

type ClassDictionary = { [id: string]: any };
type ClassArray = ClassValue[];

declare function classNames(...classes: ClassValue[]): string;

export default classNames;

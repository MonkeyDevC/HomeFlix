export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type ISODateString = string;

export type Nullable<TValue> = TValue | null;

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

declare module "zod" {
  interface GlobalMeta {
    name?: string;
    description?: string;
    details?: string;
    aliases?: string[];
    deprecated?: boolean | string;
  }
}

export {};

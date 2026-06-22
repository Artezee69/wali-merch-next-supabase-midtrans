// Minimal zod-like validator used by server-side route handlers.
// Supports the subset of API used in this project: z.string()/min/max/email,
// z.object({...}).safeParse, with .error.issues[0].message.

export type ZodIssue = { message: string };
export type ZodParseError = { success: false; error: { issues: ZodIssue[] } };
export type ZodParseSuccess<T> = { success: true; data: T };
export type ZodParseResult<T> = ZodParseSuccess<T> | ZodParseError;

type StringChecks = {
  min?: number;
  max?: number;
  email?: boolean;
};

export type StringSchema = {
  safeParse(input: unknown): ZodParseResult<string>;
  parse(input: unknown): string;
  _checks: StringChecks;
  min(n: number): StringSchema;
  max(n: number): StringSchema;
  email(): StringSchema;
};

export type AnyObjectSchema<S extends Record<string, unknown>> = {
  safeParse(input: unknown): ZodParseResult<S>;
  parse(input: unknown): S;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeString(): StringSchema {
  const base: StringSchema = {
    _checks: {},
    safeParse(input) {
      if (typeof input !== "string") {
        return { success: false, error: { issues: [{ message: "Wajib berupa teks." }] } };
      }
      const v = input.trim();
      if (this._checks.min !== undefined && v.length < this._checks.min) {
        return {
          success: false,
          error: { issues: [{ message: `Minimal ${this._checks.min} karakter.` }] },
        };
      }
      if (this._checks.max !== undefined && v.length > this._checks.max) {
        return {
          success: false,
          error: { issues: [{ message: `Maksimal ${this._checks.max} karakter.` }] },
        };
      }
      if (this._checks.email && !EMAIL_RE.test(v)) {
        return {
          success: false,
          error: { issues: [{ message: "Format email tidak valid." }] },
        };
      }
      return { success: true, data: v };
    },
    parse(input) {
      const r = this.safeParse(input);
      if (!r.success) throw new Error(r.error.issues[0]?.message || "Invalid");
      return r.data;
    },
    min(n: number) {
      return withChecks(this, { min: n });
    },
    max(n: number) {
      return withChecks(this, { max: n });
    },
    email() {
      return withChecks(this, { email: true });
    },
  };
  return base;
}

function withChecks(prev: StringSchema, add: StringChecks): StringSchema {
  const merged: StringChecks = { ...prev._checks, ...add };
  const makeLike = (checks: StringChecks): StringSchema => ({
    _checks: checks,
    safeParse(input) {
      if (typeof input !== "string") {
        return { success: false, error: { issues: [{ message: "Wajib berupa teks." }] } };
      }
      const v = input.trim();
      if (checks.min !== undefined && v.length < checks.min) {
        return { success: false, error: { issues: [{ message: `Minimal ${checks.min} karakter.` }] } };
      }
      if (checks.max !== undefined && v.length > checks.max) {
        return { success: false, error: { issues: [{ message: `Maksimal ${checks.max} karakter.` }] } };
      }
      if (checks.email && !EMAIL_RE.test(v)) {
        return { success: false, error: { issues: [{ message: "Format email tidak valid." }] } };
      }
      return { success: true, data: v };
    },
    parse(input) {
      const r = this.safeParse(input);
      if (!r.success) throw new Error(r.error.issues[0]?.message || "Invalid");
      return r.data;
    },
    min(n: number) {
      return makeLike({ ...this._checks, min: n });
    },
    max(n: number) {
      return makeLike({ ...this._checks, max: n });
    },
    email() {
      return makeLike({ ...this._checks, email: true });
    },
  });
  return makeLike(merged);
}

function makeStringLike(checks: StringChecks): StringSchema {
  return withChecks({ _checks: {} } as StringSchema, checks);
}

export const z = {
  string(): StringSchema {
    return makeString();
  },
  object<S extends Record<string, { safeParse(i: unknown): ZodParseResult<unknown> }>>(
    shape: S
  ): AnyObjectSchema<{ [K in keyof S]: Extract<ReturnType<S[K]["safeParse"]>, { success: true }>["data"] }> {
    type Out = { [K in keyof S]: Extract<ReturnType<S[K]["safeParse"]>, { success: true }>["data"] };
    return {
      safeParse(input: unknown): ZodParseResult<Out> {
        if (typeof input !== "object" || input === null) {
          return { success: false, error: { issues: [{ message: "Input harus berupa objek." }] } };
        }
        const obj = input as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(shape) as (keyof S)[]) {
          const r = shape[key].safeParse(obj[key as string]);
          if (!r.success) {
            return { success: false, error: r.error };
          }
          out[key as string] = r.data;
        }
        return { success: true, data: out as Out };
      },
      parse(input) {
        const r = this.safeParse(input);
        if (!r.success) throw new Error(r.error.issues[0]?.message || "Invalid");
        return r.data;
      },
    };
  },
};

// Augment string builder with chainable methods via a Proxy.
const stringBuilder: StringSchema & Record<string, unknown> = makeString() as StringSchema &
  Record<string, unknown>;
stringBuilder.min = (n: number) => withChecks(makeString(), { min: n });
stringBuilder.max = (n: number) => withChecks(makeString(), { max: n });
stringBuilder.email = () => withChecks(makeString(), { email: true });
(z as unknown as { string(): StringSchema }).string = () => stringBuilder;

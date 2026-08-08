import { nanoid } from "nanoid/non-secure";

// nanoid's default entropy source needs crypto.getRandomValues, which isn't
// available in the Hermes JS engine without an extra polyfill. The
// "non-secure" build uses Math.random instead — fine for local primary keys
// that are never used as security tokens.
export function generateId(): string {
  return nanoid();
}

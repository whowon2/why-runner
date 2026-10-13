/**
 * Errors thrown inside a server action reach the client with a generic
 * message in production builds (Next.js hides the original text). Errors the
 * user should see are therefore *returned* as an `ActionFailure` with a stable
 * `code`, and the client hook turns them back into an `ActionError` via
 * `unwrap` — that error is created in the browser, so its code survives.
 *
 * Keep throwing for bugs and access violations (not found, Forbidden).
 */

export type ActionParams = Record<string, string | number | string[]>;

export type ActionFailure<C extends string = string> = {
  ok: false;
  code: C;
  params?: ActionParams;
};

export type ActionResult<T, C extends string = string> =
  | { ok: true; data: T }
  | ActionFailure<C>;

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export function fail<C extends string>(
  code: C,
  params?: ActionParams,
): ActionFailure<C> {
  return { ok: false, code, params };
}

export class ActionError<C extends string = string> extends Error {
  constructor(
    readonly code: C,
    readonly params?: ActionParams,
  ) {
    super(code);
    this.name = "ActionError";
  }
}

/** Returns the data of a successful result, throws `ActionError` otherwise. */
export function unwrap<T, C extends string>(result: ActionResult<T, C>): T {
  if (result.ok) return result.data;
  throw new ActionError(result.code, result.params);
}

export function isActionError<C extends string>(
  error: unknown,
  code: C,
): error is ActionError<C> {
  return error instanceof ActionError && error.code === code;
}

/** React Query `retry`: expected failures won't change on retry. */
export function retryUnlessActionError(failureCount: number, error: Error) {
  return !(error instanceof ActionError) && failureCount < 3;
}

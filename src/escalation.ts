/**
 * Enquiry escalation with duplicate suppression and PII protection.
 *
 * This is the feature the repository was built around. It is deliberately small: one
 * vertical slice, three requirements, and enough edge cases to make the review discipline
 * matter. The specification is the point of this repository; this file is the evidence it
 * was followed.
 *
 * Specification: docs/specs/0001-enquiry-escalation.md
 * What went wrong on the way here, and what corrected it: TESTING.md
 */

export interface Negotiator {
  readonly id: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly priority: number;
}

export interface Delivery {
  readonly negotiatorId: string;
  readonly enquiryId: string;
  readonly sentAt: number;
  readonly acknowledgedAt: number | null;
}

export interface EscalationRequest {
  readonly enquiryId: string;
  readonly enquirerDisplayName: string;
  readonly negotiators: readonly Negotiator[];
  readonly deliveries: readonly Delivery[];
  readonly now: number;
  readonly windowMs?: number;
}

export type EscalationOutcome =
  | { readonly kind: 'notify'; readonly negotiator: Negotiator; readonly message: SafeMessage }
  | { readonly kind: 'suppressed'; readonly reason: SuppressionReason }
  | { readonly kind: 'waiting'; readonly untilMs: number }
  | { readonly kind: 'exhausted' };

export type SuppressionReason =
  | 'already_acknowledged'
  | 'already_notified'
  | 'no_reachable_channel';

export const DEFAULT_WINDOW_MS = 3 * 60_000;

/**
 * The message that goes out.
 *
 * Note what is not in it. No email address, no phone number, no coordinate, no enquiry
 * identifier in the body. The recipient already knows which enquiry it is; everything else
 * is behind a signed link that names one enquiry and one negotiator and expires.
 *
 * This shape is the PII protection requirement, expressed as a type rather than as a
 * convention somebody has to remember.
 */
export interface SafeMessage {
  readonly recipientName: string;
  readonly enquirerFirstName: string;
  readonly body: string;
  readonly linkToken: string;
}

/**
 * Decides the next escalation step.
 *
 * Every branch is a requirement from the specification, and every branch has a test named
 * after the situation rather than after the branch.
 */
export function nextEscalation(request: EscalationRequest): EscalationOutcome {
  const windowMs = request.windowMs ?? DEFAULT_WINDOW_MS;

  // Any acknowledgement stops the chain. The point is to reach somebody, and somebody has
  // been reached; continuing would wake a second person for no reason.
  if (request.deliveries.some((delivery) => delivery.acknowledgedAt !== null)) {
    return { kind: 'suppressed', reason: 'already_acknowledged' };
  }

  const ordered = [...request.negotiators].sort(
    (a, b) => a.priority - b.priority || a.id.localeCompare(b.id),
  );

  const notified = new Set(request.deliveries.map((delivery) => delivery.negotiatorId));
  const candidates = ordered.filter((negotiator) => !notified.has(negotiator.id));

  if (candidates.length === 0) return { kind: 'exhausted' };

  /*
   * A negotiator with neither an email address nor a phone number cannot be reached, so the
   * chain moves past them. Reporting success would be a lie, and failing the whole
   * escalation would punish the enquirer for a data problem in the negotiator list.
   *
   * This is a filter rather than a recursive call with a synthetic delivery injected. The
   * first version did the latter, and the injected delivery made the timing branch below
   * think a message had just been sent, so the chain waited out a window for something
   * that was never sent. A spec-derived test caught it; TESTING.md has the detail.
   */
  const next = candidates.find((negotiator) => negotiator.email !== null || negotiator.phone !== null);

  if (next === undefined) return { kind: 'suppressed', reason: 'no_reachable_channel' };

  // The first negotiator goes immediately. Everyone after waits out the window from the last
  // send, so a slow first delivery does not eat the time the next negotiator gets. Only real
  // deliveries count here, which is exactly what the bug above got wrong.
  if (notified.size > 0) {
    const lastSentAt = request.deliveries.reduce(
      (latest, delivery) => Math.max(latest, delivery.sentAt),
      0,
    );
    const dueAt = lastSentAt + windowMs;
    if (request.now < dueAt) return { kind: 'waiting', untilMs: dueAt };
  }

  return {
    kind: 'notify',
    negotiator: next,
    message: composeMessage(next, request),
  };
}

function composeMessage(negotiator: Negotiator, request: EscalationRequest): SafeMessage {
  const enquirerFirstName = firstNameOnly(request.enquirerDisplayName);

  return {
    recipientName: firstNameOnly(negotiator.displayName),
    enquirerFirstName,
    // Deliberately vague about the situation and specific about what to do. The link
    // carries the detail, behind a token scoped to one enquiry and one negotiator.
    body:
      `${enquirerFirstName} has raised a EstateFlow alert and asked for you. ` +
      'Open the link to see the latest and let them know you have seen it. ' +
      'EstateFlow is a portfolio demonstration and does not negotiator emergency services.',
    linkToken: `${request.enquiryId}:${negotiator.id}`,
  };
}

/**
 * First name only.
 *
 * A message can be forwarded, screenshotted, or read from a lock screen by whoever is
 * holding the phone. A full name is more identifying than the message needs, and the
 * recipient already knows who this is.
 */
export function firstNameOnly(displayName: string): string {
  const trimmed = displayName.trim();
  if (trimmed.length === 0) return 'A EstateFlow user';
  return trimmed.split(/\s+/)[0] ?? 'A EstateFlow user';
}

/**
 * Redacts a structure before it reaches a log sink.
 *
 * Matches by key name at any depth so a developer logging a whole request object produces
 * a redacted line rather than an enquiry. This is a safety net, not permission: the rule
 * is still to log identifiers rather than values.
 */
const SENSITIVE_KEYS = [
  'email',
  'phone',
  'displayname',
  'name',
  'latitude',
  'longitude',
  'address',
  'token',
  'linktoken',
  'body',
  'password',
] as const;

export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redactForLog(item, depth + 1));

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      const sensitive = SENSITIVE_KEYS.some(
        (candidate) => lower === candidate || lower.endsWith(candidate),
      );
      output[key] = sensitive ? '[redacted]' : redactForLog(nested, depth + 1);
    }
    return output;
  }

  return value;
}

/**
 * What actually gets logged for an escalation.
 *
 * Identifiers and counts only. Enough to answer "did the chain run, how far did it get,
 * and how long did it take", which is every question anyone has ever needed a log for
 * here, without a single piece of personal data.
 */
export function escalationLogFields(
  request: EscalationRequest,
  outcome: EscalationOutcome,
): Record<string, unknown> {
  return {
    enquiryId: request.enquiryId,
    negotiatorCount: request.negotiators.length,
    deliveryCount: request.deliveries.length,
    outcome: outcome.kind,
    ...(outcome.kind === 'notify' ? { negotiatorId: outcome.negotiator.id } : {}),
    ...(outcome.kind === 'suppressed' ? { suppressionReason: outcome.reason } : {}),
  };
}

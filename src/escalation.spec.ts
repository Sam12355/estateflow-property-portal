import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WINDOW_MS,
  escalationLogFields,
  firstNameOnly,
  nextEscalation,
  redactForLog,
  type Contact,
  type Delivery,
  type EscalationRequest,
} from './escalation';

/**
 * These tests were written from the acceptance criteria in
 * docs/specs/0001-trusted-contact-escalation.md, before the implementation existed.
 *
 * That ordering is the single most important habit in this playbook. In the first attempt
 * the agent wrote the implementation and then wrote tests against it; they passed, and two
 * of the acceptance criteria were not actually met. Tests written from the specification
 * caught both immediately. AI_WORKLOG.md entry 1 has the detail.
 */

const NOW = 1_773_000_000_000;

const contacts: Contact[] = [
  { id: 'c1', displayName: 'Ada Lovelace', email: 'ada@example.com', phone: null, priority: 1 },
  { id: 'c2', displayName: 'Bram Bakker', email: null, phone: '+1 555 0101', priority: 2 },
  { id: 'c3', displayName: 'Cleo Duarte', email: 'cleo@example.com', phone: null, priority: 3 },
];

function request(overrides: Partial<EscalationRequest> = {}): EscalationRequest {
  return {
    incidentId: 'incident-1',
    subjectDisplayName: 'Juno Petrov',
    contacts,
    deliveries: [],
    now: NOW,
    ...overrides,
  };
}

function delivery(contactId: string, overrides: Partial<Delivery> = {}): Delivery {
  return {
    contactId,
    incidentId: 'incident-1',
    sentAt: NOW,
    acknowledgedAt: null,
    ...overrides,
  };
}

// AC1: the highest-priority contact is notified first.
describe('AC1 - ordering', () => {
  it('notifies the highest-priority contact first', () => {
    const outcome = nextEscalation(request());

    expect(outcome.kind).toBe('notify');
    if (outcome.kind !== 'notify') return;
    expect(outcome.contact.id).toBe('c1');
  });

  it('uses priority, not the order of the list', () => {
    const outcome = nextEscalation(
      request({ contacts: [contacts[2]!, contacts[0]!, contacts[1]!] }),
    );
    expect(outcome.kind).toBe('notify');
    if (outcome.kind !== 'notify') return;
    expect(outcome.contact.id).toBe('c1');
  });

  it('breaks a priority tie deterministically', () => {
    // Without a tiebreak, two contacts at the same priority alternate between runs and
    // the escalation order is not reproducible.
    const tied: Contact[] = [
      { ...contacts[0]!, id: 'zz', priority: 1 },
      { ...contacts[1]!, id: 'aa', priority: 1 },
    ];
    const outcome = nextEscalation(request({ contacts: tied }));
    expect(outcome.kind).toBe('notify');
    if (outcome.kind !== 'notify') return;
    expect(outcome.contact.id).toBe('aa');
  });
});

// AC2: nobody is notified twice for the same incident.
describe('AC2 - duplicate suppression', () => {
  it('does not notify a contact who has already been notified', () => {
    const outcome = nextEscalation(
      request({ deliveries: [delivery('c1')], now: NOW + DEFAULT_WINDOW_MS + 1 }),
    );

    expect(outcome.kind).toBe('notify');
    if (outcome.kind !== 'notify') return;
    expect(outcome.contact.id).toBe('c2');
  });

  it('stops entirely once anybody acknowledges', () => {
    const outcome = nextEscalation(
      request({
        deliveries: [delivery('c1', { acknowledgedAt: NOW + 30_000 })],
        now: NOW + 600_000,
      }),
    );

    expect(outcome.kind).toBe('suppressed');
    if (outcome.kind !== 'suppressed') return;
    expect(outcome.reason).toBe('already_acknowledged');
  });

  it('stops even when the acknowledgement came from a later contact', () => {
    const outcome = nextEscalation(
      request({
        deliveries: [delivery('c1'), delivery('c2', { acknowledgedAt: NOW + 300_000 })],
        now: NOW + 900_000,
      }),
    );
    expect(outcome.kind).toBe('suppressed');
  });

  it('running the escalation repeatedly notifies each person exactly once', () => {
    // The scheduler runs on a timer and will sometimes overlap with itself. Idempotence
    // is what stops that turning into a stream of messages.
    let deliveries: Delivery[] = [];
    let now = NOW;
    const notified: string[] = [];

    for (let pass = 0; pass < 20; pass += 1) {
      const outcome = nextEscalation(request({ deliveries, now }));

      if (outcome.kind === 'notify') {
        notified.push(outcome.contact.id);
        deliveries = [...deliveries, delivery(outcome.contact.id, { sentAt: now })];
      } else if (outcome.kind === 'waiting') {
        now = outcome.untilMs;
      } else {
        break;
      }
    }

    expect(notified).toEqual(['c1', 'c2', 'c3']);
    expect(new Set(notified).size).toBe(notified.length);
  });

  it('is exhausted once everyone has been notified', () => {
    const outcome = nextEscalation(
      request({
        deliveries: [delivery('c1'), delivery('c2'), delivery('c3')],
        now: NOW + 3_600_000,
      }),
    );
    expect(outcome.kind).toBe('exhausted');
  });
});

// AC3: escalation waits out the window from the last send.
describe('AC3 - timing', () => {
  it('notifies the first contact immediately', () => {
    expect(nextEscalation(request()).kind).toBe('notify');
  });

  it('waits before escalating to the next contact', () => {
    const outcome = nextEscalation(
      request({ deliveries: [delivery('c1')], now: NOW + 60_000 }),
    );

    expect(outcome.kind).toBe('waiting');
    if (outcome.kind !== 'waiting') return;
    expect(outcome.untilMs).toBe(NOW + DEFAULT_WINDOW_MS);
  });

  it('measures the window from the last send, not from the first', () => {
    // A slow first delivery must not eat the time the second contact gets.
    const lateSend = NOW + 120_000;
    const outcome = nextEscalation(
      request({
        deliveries: [delivery('c1', { sentAt: lateSend })],
        now: lateSend + 60_000,
      }),
    );

    expect(outcome.kind).toBe('waiting');
    if (outcome.kind !== 'waiting') return;
    expect(outcome.untilMs).toBe(lateSend + DEFAULT_WINDOW_MS);
  });
});

// AC4: an unreachable contact does not stall the chain.
describe('AC4 - unreachable contacts', () => {
  it('skips a contact with no email address and no phone number', () => {
    const withUnreachable: Contact[] = [
      { id: 'broken', displayName: 'No Channels', email: null, phone: null, priority: 1 },
      contacts[1]!,
    ];

    const outcome = nextEscalation(request({ contacts: withUnreachable }));

    // Reporting success would be a lie; failing the whole escalation would punish the
    // subject for a data problem in their contact list.
    expect(outcome.kind).toBe('notify');
    if (outcome.kind !== 'notify') return;
    expect(outcome.contact.id).toBe('c2');
  });

  it('reports suppression when nobody is reachable', () => {
    const outcome = nextEscalation({
      ...request(),
      contacts: [{ id: 'broken', displayName: 'No Channels', email: null, phone: null, priority: 1 }],
    });

    expect(outcome.kind).toBe('suppressed');
    if (outcome.kind !== 'suppressed') return;
    expect(outcome.reason).toBe('no_reachable_channel');
  });

  it('does not loop for ever on an unreachable contact', () => {
    // The first version recursed without recording the skip and hung. Caught by this
    // test; see AI_WORKLOG.md entry 2.
    const many: Contact[] = Array.from({ length: 5 }, (_unused, index) => ({
      id: `broken-${index}`,
      displayName: 'No Channels',
      email: null,
      phone: null,
      priority: index + 1,
    }));

    const outcome = nextEscalation(request({ contacts: many }));
    expect(outcome.kind).toBe('suppressed');
  });
});

// AC5: no personal data leaves the system beyond what the recipient already has.
describe('AC5 - protecting personal information', () => {
  it('uses first names only in the message', () => {
    const outcome = nextEscalation(request());

    expect(outcome.kind).toBe('notify');
    if (outcome.kind !== 'notify') return;
    expect(outcome.message.subjectFirstName).toBe('Juno');
    expect(outcome.message.recipientName).toBe('Ada');
    // A message gets forwarded, screenshotted, or read from a lock screen by whoever is
    // holding the phone.
    expect(JSON.stringify(outcome.message)).not.toContain('Petrov');
    expect(JSON.stringify(outcome.message)).not.toContain('Lovelace');
  });

  it('puts no email address or phone number in the message body', () => {
    const outcome = nextEscalation(request());
    if (outcome.kind !== 'notify') return;

    expect(outcome.message.body).not.toContain('@');
    expect(outcome.message.body).not.toContain('555');
  });

  it('carries the demonstration notice', () => {
    const outcome = nextEscalation(request());
    if (outcome.kind !== 'notify') return;
    expect(outcome.message.body).toContain('does not contact emergency services');
  });

  it('falls back to something neutral for an empty display name', () => {
    expect(firstNameOnly('   ')).toBe('A GuardianLink user');
  });

  it('handles a single-word name', () => {
    expect(firstNameOnly('Prince')).toBe('Prince');
  });
});

describe('AC5 - logging', () => {
  it('redacts personal fields at any nesting depth', () => {
    const redacted = redactForLog({
      incidentId: 'incident-1',
      contact: { id: 'c1', email: 'ada@example.com', phone: '+1 555 0101' },
      location: { latitude: 53.5, longitude: 3.2 },
    }) as Record<string, Record<string, unknown>>;

    expect(redacted['incidentId']).toBe('incident-1');
    expect(redacted['contact']?.['id']).toBe('c1');
    expect(redacted['contact']?.['email']).toBe('[redacted]');
    expect(redacted['location']?.['latitude']).toBe('[redacted]');
  });

  it('redacts a whole request object passed by mistake', () => {
    // Developers log whole objects under pressure. The safe outcome has to be the default.
    const serialised = JSON.stringify(redactForLog(request()));

    expect(serialised).not.toContain('ada@example.com');
    expect(serialised).not.toContain('555 0101');
    expect(serialised).not.toContain('Juno Petrov');
  });

  it('keeps the identifiers that make a log useful', () => {
    const fields = escalationLogFields(request(), nextEscalation(request()));

    expect(fields['incidentId']).toBe('incident-1');
    expect(fields['contactId']).toBe('c1');
    expect(fields['outcome']).toBe('notify');
    // Nobody needs a value to debug this, so nobody has a reason to log one.
    expect(JSON.stringify(fields)).not.toContain('@');
    expect(JSON.stringify(fields)).not.toContain('Ada');
  });

  it('records why an escalation was suppressed', () => {
    const suppressed = request({ deliveries: [delivery('c1', { acknowledgedAt: NOW })] });
    const fields = escalationLogFields(suppressed, nextEscalation(suppressed));

    expect(fields['suppressionReason']).toBe('already_acknowledged');
  });

  it('stops at a depth limit rather than recursing without bound', () => {
    let deep: Record<string, unknown> = { email: 'x@example.com' };
    for (let i = 0; i < 20; i += 1) deep = { nested: deep };
    expect(JSON.stringify(redactForLog(deep))).toContain('[truncated]');
  });
});

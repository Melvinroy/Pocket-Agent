import { randomUUID } from 'node:crypto';

import { z } from 'zod';

export const PROTOCOL_VERSION = '0.2.0';

export const capabilitiesSchema = z.object({
  supportsApprovals: z.boolean(),
  supportsCommandStreaming: z.boolean(),
  supportsDiffStreaming: z.boolean(),
  supportsPlanUpdates: z.boolean(),
});

export const commandNameSchema = z.enum([
  'capabilities.get',
  'models.list',
  'threads.create',
  'threads.list',
  'threads.read',
  'threads.resume',
  'threads.archive',
  'turns.start',
  'turns.steer',
  'turns.interrupt',
  'reviews.start',
  'files.list',
  'files.read',
  'files.write',
  'files.stat',
  'commands.exec',
  'approvals.resolve',
]);

export const eventNameSchema = z.enum([
  'turn.status',
  'turn.output',
  'turn.diff',
  'turn.plan',
  'approval.requested',
  'thread.updated',
  'bridge.lifecycle',
]);

export const envelopeSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION),
  id: z.string().min(1),
  timestamp: z.string().datetime(),
});

export const requestEnvelopeSchema = envelopeSchema.extend({
  kind: z.literal('request'),
  name: commandNameSchema,
  payload: z.record(z.string(), z.unknown()),
});

export const responseEnvelopeSchema = envelopeSchema.extend({
  kind: z.literal('response'),
  requestId: z.string().min(1),
  success: z.boolean(),
  payload: z.record(z.string(), z.unknown()).optional(),
  error: z
    .object({
      code: z.string().min(1),
      message: z.string().min(1),
      retryable: z.boolean().default(false),
    })
    .optional(),
});

export const eventEnvelopeSchema = envelopeSchema.extend({
  kind: z.literal('event'),
  name: eventNameSchema,
  payload: z.record(z.string(), z.unknown()),
});

export type CommandName = z.infer<typeof commandNameSchema>;
export type EventName = z.infer<typeof eventNameSchema>;
export type Capabilities = z.infer<typeof capabilitiesSchema>;
export type RequestEnvelope = z.infer<typeof requestEnvelopeSchema>;
export type ResponseEnvelope = z.infer<typeof responseEnvelopeSchema>;
export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;
export type ProtocolEnvelope =
  | RequestEnvelope
  | ResponseEnvelope
  | EventEnvelope;

export interface ProtocolTransport {
  send(message: ProtocolEnvelope): Promise<void>;
}

export function createRequestEnvelope(
  name: CommandName,
  payload: RequestEnvelope['payload'],
  id: string = randomUUID(),
): RequestEnvelope {
  return requestEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    kind: 'request',
    id,
    name,
    payload,
    timestamp: new Date().toISOString(),
  });
}

export function createEventEnvelope(
  name: EventName,
  payload: EventEnvelope['payload'],
  id: string = randomUUID(),
): EventEnvelope {
  return eventEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    kind: 'event',
    id,
    name,
    payload,
    timestamp: new Date().toISOString(),
  });
}

export function createResponseEnvelope(
  requestId: string,
  success: boolean,
  options: {
    id?: string;
    payload?: ResponseEnvelope['payload'];
    error?: ResponseEnvelope['error'];
  } = {},
): ResponseEnvelope {
  return responseEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    kind: 'response',
    id: options.id ?? randomUUID(),
    requestId,
    success,
    payload: options.payload,
    error: options.error,
    timestamp: new Date().toISOString(),
  });
}

export function decodeEnvelope(input: unknown): ProtocolEnvelope {
  const parsed = z
    .union([requestEnvelopeSchema, responseEnvelopeSchema, eventEnvelopeSchema])
    .safeParse(input);

  if (!parsed.success) {
    throw new Error(
      `Invalid protocol envelope: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
    );
  }

  return parsed.data;
}

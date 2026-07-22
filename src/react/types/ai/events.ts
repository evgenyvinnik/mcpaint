/**
 * Server-sent event types for AI streaming
 * The event shapes emitted by the AI draw endpoint over SSE.
 * Based on the architecture defined in docs/AI.md
 */

import type { DrawingCommand } from "./commands";

// ═══════════════════════════════════════════════════════════════════════════
// SSE EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Token event - partial AI text response
 */
export interface TokenEvent {
  type: "token";
  content: string;
}

/**
 * Commands event - drawing commands from tool invocation
 */
export interface CommandsEvent {
  type: "commands";
  commands: DrawingCommand[];
}

/**
 * Progress event - drawing progress update
 */
export interface ProgressEvent {
  type: "progress";
  current: number;
  total: number;
}

/**
 * Done event - completion with full message
 */
export interface DoneEvent {
  type: "done";
  message?: string;
}

/**
 * Error event - error notification
 */
export interface ErrorEvent {
  type: "error";
  message: string;
}

/**
 * Union type of all SSE events
 */
export type SSEEvent = TokenEvent | CommandsEvent | ProgressEvent | DoneEvent | ErrorEvent;

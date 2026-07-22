/**
 * Chat and API request/response types for AI integration
 * Chat message structures plus the request/response bodies exchanged with the
 * AI draw endpoint. Based on the architecture defined in docs/AI.md
 */

import type { DrawingCommand } from "./commands";

// ═══════════════════════════════════════════════════════════════════════════
// CHAT MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chat message role
 */
export type ChatRole = "user" | "assistant";

/**
 * Chat message interface
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Message role (user or assistant) */
  role: ChatRole;
  /** Message text content */
  content: string;
  /** Associated drawing commands (for assistant messages) */
  commands?: DrawingCommand[];
  /** Message timestamp */
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Current color state for API context
 */
export interface ColorState {
  primary: string;
  secondary: string;
}

/**
 * AI API request body
 */
export interface AIDrawRequest {
  /** Chat message history */
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
  /** Current canvas dimensions */
  canvasWidth: number;
  canvasHeight: number;
  /** Current color state */
  currentColors: ColorState;
}

/**
 * AI API response (for non-streaming)
 */
export interface AIDrawResponse {
  /** AI response text */
  message: string;
  /** Drawing commands to execute */
  commands: DrawingCommand[];
}

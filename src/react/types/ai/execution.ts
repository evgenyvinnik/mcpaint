/**
 * Command executor types for AI integration
 * Status, results, config, and progress tracking for executing drawing
 * commands. Based on the architecture defined in docs/AI.md
 */

import type { DrawingCommand } from "./commands";

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND EXECUTOR TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Command execution status
 */
export type CommandExecutionStatus = "pending" | "executing" | "completed" | "failed" | "cancelled";

/**
 * Command execution result
 */
export interface CommandExecutionResult {
  /** Command that was executed */
  command: DrawingCommand;
  /** Execution status */
  status: CommandExecutionStatus;
  /** Error message if failed */
  error?: string;
  /** Execution duration in ms */
  duration?: number;
}

/**
 * Command executor configuration
 */
export interface CommandExecutorConfig {
  /** Delay between commands in ms (for animation) */
  animationDelay: number;
  /** Whether to skip animation */
  skipAnimation: boolean;
}

/**
 * Execution progress state
 */
export interface ExecutionProgress {
  /** Current command index */
  current: number;
  /** Total number of commands */
  total: number;
  /** Currently executing command */
  currentCommand?: DrawingCommand;
}

/**
 * Job State Machine
 * Defines allowed state transitions for Job status
 */

export type JobStatus = 'new' | 'queued' | 'scored' | 'archived' | 'pending_upgrade';

interface StateTransition {
  from: JobStatus;
  to: JobStatus;
}

const ALLOWED_TRANSITIONS: StateTransition[] = [
  { from: 'new', to: 'queued' },
  { from: 'new', to: 'pending_upgrade' }, // When plan limit is exceeded
  { from: 'pending_upgrade', to: 'queued' }, // After plan upgrade
  { from: 'queued', to: 'scored' },
  { from: 'scored', to: 'archived' },
];

export class JobStateMachine {
  /**
   * Check if a state transition is allowed
   */
  canTransition(from: JobStatus, to: JobStatus): boolean {
    return ALLOWED_TRANSITIONS.some(
      (transition) => transition.from === from && transition.to === to
    );
  }

  /**
   * Validate and throw error if transition is not allowed
   */
  validateTransition(from: JobStatus, to: JobStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid state transition: Cannot transition from '${from}' to '${to}'. ` +
          `Allowed transitions from '${from}': ${this.getAllowedTransitionsFrom(from).join(', ')}`
      );
    }
  }

  /**
   * Get all allowed transitions from a given state
   */
  getAllowedTransitionsFrom(from: JobStatus): JobStatus[] {
    return ALLOWED_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
  }

  /**
   * Get all allowed transitions to a given state
   */
  getAllowedTransitionsTo(to: JobStatus): JobStatus[] {
    return ALLOWED_TRANSITIONS.filter((t) => t.to === to).map((t) => t.from);
  }

  /**
   * Check if status is valid
   */
  isValidStatus(status: string): status is JobStatus {
    return ['new', 'queued', 'scored', 'archived', 'pending_upgrade'].includes(status);
  }
}

export default new JobStateMachine();

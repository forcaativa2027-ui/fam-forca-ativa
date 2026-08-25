import type { SupabaseClient } from "@supabase/supabase-js";
import { createRiskEngine, RiskEngine } from "./riskEngine";

export type AssessmentState = 
  | 'initial'
  | 'informed'
  | 'in_progress'
  | 'emergency'
  | 'protection_special'
  | 'orientation'
  | 'optional_attachment'
  | 'result'
  | 'closed';

export interface StateTransition {
  from: AssessmentState | null;
  to: AssessmentState;
  trigger: 'user_answer' | 'rule_engine' | 'manual' | 'system';
  ruleCode?: string;
  metadata?: Record<string, unknown>;
}

export interface StateMachineConfig {
  initialState: AssessmentState;
  transitions: Record<AssessmentState, AssessmentState[]>;
}

export interface AssessmentSession {
  id: string;
  userId: string | null;
  caseId: string | null;
  state: AssessmentState;
  currentQuestionIndex: number;
  answeredQuestions: Record<string, string>;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  emergencyFlag: boolean;
  specialFlows: string[];
  currentQuestionCode: string | null;
}

/**
 * Assessment State Machine
 * Manages the state transitions of a risk assessment session
 */
export class AssessmentStateMachine {
  private sb: SupabaseClient;
  private riskEngine: RiskEngine;
  private session: AssessmentSession | null = null;

  // Valid state transitions
  private readonly validTransitions: Record<AssessmentState, AssessmentState[]> = {
    initial: ['informed', 'closed'],
    informed: ['in_progress', 'closed'],
    in_progress: ['emergency', 'protection_special', 'orientation', 'optional_attachment', 'result', 'closed'],
    emergency: ['protection_special', 'orientation', 'result', 'closed'],
    protection_special: ['orientation', 'optional_attachment', 'result', 'closed'],
    orientation: ['optional_attachment', 'result', 'closed'],
    optional_attachment: ['result', 'closed'],
    result: ['closed'],
    closed: [] // Terminal state
  };

  // Terminal states
  private readonly terminalStates: AssessmentState[] = ['closed'];

  // States that allow user answers
  private readonly answerableStates: AssessmentState[] = ['in_progress', 'emergency', 'protection_special', 'orientation', 'optional_attachment'];

  // States that allow attachments
  private readonly attachableStates: AssessmentState[] = ['optional_attachment', 'result'];

  constructor(sb: SupabaseClient) {
    this.sb = sb;
    this.riskEngine = createRiskEngine(sb);
  }

  /**
   * Initialize a new assessment session
   */
  async initializeSession(
    userId: string,
    caseId?: string,
    initialAnswers: Record<string, string> = {}
  ): Promise<AssessmentSession> {
    const session: AssessmentSession = {
      id: crypto.randomUUID(),
      userId,
      caseId: caseId || null,
      state: 'initial',
      currentQuestionIndex: 0,
      answeredQuestions: { ...initialAnswers },
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      completedAt: null,
      emergencyFlag: false,
      specialFlows: [],
      currentQuestionCode: null
    };

    this.session = session;
    return session;
  }

  /**
   * Resume an existing session from database
   */
  async resumeSession(caseId: string): Promise<AssessmentSession | null> {
    const riskEngine = createRiskEngine(this.sb);
    const riskCase = await riskEngine.getRiskCaseFull(caseId);
    
    if (!riskCase) return null;

    const answers: Record<string, string> = {};
    for (const answer of riskCase.answers) {
      answers[answer.question_key] = answer.answer;
    }

    const specialFlows = riskCase.special_flows || [];
    const emergencyFlag = riskCase.emergency_flag || false;
    const state = (riskCase.state as AssessmentState) || 'in_progress';

    this.session = {
      id: crypto.randomUUID(),
      userId: riskCase.user_id,
      caseId: riskCase.id,
      state,
      currentQuestionIndex: 0,
      answeredQuestions: answers,
      startedAt: riskCase.created_at,
      lastActivityAt: new Date().toISOString(),
      completedAt: riskCase.completed_at,
      emergencyFlag,
      specialFlows: specialFlows || [],
      currentQuestionCode: null
    };

    return this.session;
  }

  /**
   * Get current session
   */
  getSession(): AssessmentSession | null {
    return this.session;
  }

  /**
   * Check if transition is valid
   */
  canTransition(from: AssessmentState, to: AssessmentState): boolean {
    if (from === to) return false;
    const allowed = this.validTransitions[from] || [];
    return allowed.includes(to);
  }

  /**
   * Execute state transition
   */
  async transition(
    to: AssessmentState,
    trigger: 'user_answer' | 'rule_engine' | 'manual' | 'system',
    ruleCode?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<boolean> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const from = this.session.state;

    if (!this.canTransition(from, to)) {
      console.warn(`Invalid state transition: ${from} -> ${to}`);
      return false;
    }

    const fromState = this.session.state;
    this.session.state = to;
    this.session.lastActivityAt = new Date().toISOString();

    // Record transition in database if caseId exists
    if (this.session.caseId) {
      await this.recordTransition(
        this.session.caseId,
        fromState,
        to,
        'user_answer',
        'system',
        { metadata }
      );
    }

    // Handle special state behaviors
    await this.handleStateEntry(to);

    return true;
  }

  /**
   * Handle side effects when entering a state
   */
  private async handleStateEntry(state: AssessmentState) {
    if (!this.session) return;

    switch (state) {
      case 'informed':
        // User has seen the presentation, ready for questions
        break;
      case 'in_progress':
        // Normal question flow
        break;
      case 'emergency':
        // Emergency flag already set by rule engine
        break;
      case 'protection_special':
        // Special protection flow active
        break;
      case 'orientation':
        // Showing orientation/results
        break;
      case 'optional_attachment':
        // Allow file uploads
        break;
      case 'result':
        // Assessment complete, showing results
        break;
      case 'closed':
        this.session.completedAt = new Date().toISOString();
        break;
    }
  }

  /**
   * Record state transition in database
   */
  private async recordTransition(
    caseId: string,
    fromState: AssessmentState,
    toState: AssessmentState,
    trigger: 'user_answer' | 'rule_engine' | 'manual' | 'system',
    triggeredBy: 'user_answer' | 'rule_engine' | 'manual' | 'system' = 'system',
    metadata: Record<string, unknown> = {}
  ) {
    try {
      const riskEngine = createRiskEngine(this.sb);
      await riskEngine.recordStateTransition(
        this.session!.caseId!,
        fromState,
        this.session!.state,
        'state_change',
        null,
        triggeredBy,
        { from_state: fromState, to_state: toState, ...metadata }
      );
    } catch (error) {
      console.error('Error recording state transition:', error);
    }
  }

  /**
   * Check if current state allows user answers
   */
  canAnswer(): boolean {
    if (!this.session) return false;
    return this.answerableStates.includes(this.session.state);
  }

  /**
   * Check if current state allows attachments
   */
  canAttach(): boolean {
    if (!this.session) return false;
    return this.attachableStates.includes(this.session.state);
  }

  /**
   * Check if assessment is in terminal state
   */
  isComplete(): boolean {
    if (!this.session) return true;
    return this.terminalStates.includes(this.session.state);
  }

  /**
   * Check if assessment is in emergency state
   */
  isEmergency(): boolean {
    if (!this.session) return false;
    return this.session.emergencyFlag || this.session.state === 'emergency';
  }

  /**
   * Get current state
   */
  getState(): AssessmentState {
    return this.session?.state || 'initial';
  }

  /**
   * Get session data for persistence
   */
  getSessionData(): AssessmentSession | null {
    return this.session;
  }

  /**
   * Update answered questions
   */
  updateAnswers(answers: Record<string, string>) {
    if (this.session) {
      this.session.answeredQuestions = { ...this.session.answeredQuestions, ...answers };
      this.session.lastActivityAt = new Date().toISOString();
    }
  }

  /**
   * Set current question
   */
  setCurrentQuestion(questionCode: string | null) {
    if (this.session) {
      this.session.currentQuestionCode = questionCode;
      this.session.lastActivityAt = new Date().toISOString();
    }
  }

  /**
   * Set emergency flag
   */
  setEmergencyFlag(flag: boolean) {
    if (this.session) {
      this.session.emergencyFlag = flag;
      if (flag && this.session.state !== 'emergency') {
        this.transition('emergency', 'rule_engine');
      }
    }
  }

  /**
   * Add special flow
   */
  addSpecialFlow(flow: string) {
    if (this.session && !this.session.specialFlows.includes(flow)) {
      this.session.specialFlows.push(flow);
    }
  }

  /**
   * Get special flows
   */
  getSpecialFlows(): string[] {
    return this.session?.specialFlows || [];
  }

  /**
   * Check if session has specific special flow
   */
  hasSpecialFlow(flow: string): boolean {
    return this.session?.specialFlows.includes(flow) || false;
  }

  /**
   * Get answered questions count
   */
  getAnsweredCount(): number {
    if (!this.session) return 0;
    return Object.keys(this.session.answeredQuestions).length;
  }

  /**
   * Get answers
   */
  getAnswers(): Record<string, string> {
    return this.session?.answeredQuestions || {};
  }

  /**
   * Save session to database (for persistence/resumption)
   */
  async persistSession(): Promise<void> {
    if (!this.session || !this.session.caseId) return;

    // The actual persistence of answers is handled by the risk engine services
    // This method could be extended to save session state to a dedicated table
    // For now, the session is kept in memory and answers are persisted via fam_risk_answers
  }

  /**
   * Check if assessment can be resumed
   */
  static canResume(caseId: string): boolean {
    // This would check if case exists and is not in terminal state
    return true; // Implementation would check database
  }

  /**
   * Get progress percentage
   */
  getProgress(totalQuestions: number): number {
    if (!this.session) return 0;
    const answered = this.getAnsweredCount();
    return totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
  }

  /**
   * Get next question index
   */
  getNextQuestionIndex(totalQuestions: number): number {
    if (!this.session) return 0;
    return Math.min(this.session.currentQuestionIndex, totalQuestions - 1);
  }

  /**
   * Increment question index
   */
  incrementQuestionIndex() {
    if (this.session) {
      this.session.currentQuestionIndex++;
      this.session.lastActivityAt = new Date().toISOString();
    }
  }

  /**
   * Reset question index
   */
  resetQuestionIndex() {
    if (this.session) {
      this.session.currentQuestionIndex = 0;
    }
  }

  /**
   * Set case ID
   */
  setCaseId(caseId: string) {
    if (this.session) {
      this.session.caseId = caseId;
    }
  }

  /**
   * Get case ID
   */
  getCaseId(): string | null {
    return this.session?.caseId || null;
  }

  /**
   * Create a fresh state machine instance
   */
  static create(sb: SupabaseClient): AssessmentStateMachine {
    return new AssessmentStateMachine(sb);
  }
}

/**
 * Factory function to create AssessmentStateMachine instance
 */
export function createAssessmentStateMachine(sb: SupabaseClient): AssessmentStateMachine {
  return new AssessmentStateMachine(sb);
}

/**
 * Helper to check if a state is valid
 */
export function isValidState(state: string): state is AssessmentState {
  const validStates: AssessmentState[] = [
    'initial',
    'informed',
    'in_progress',
    'emergency',
    'protection_special',
    'orientation',
    'optional_attachment',
    'result',
    'closed'
  ];
  return validStates.includes(state as AssessmentState);
}

/**
 * Get all valid states
 */
export function getAllStates(): AssessmentState[] {
  return [
    'initial',
    'informed',
    'in_progress',
    'emergency',
    'protection_special',
    'orientation',
    'optional_attachment',
    'result',
    'closed'
  ];
}

/**
 * Get valid transitions from a state
 */
export function getValidTransitions(from: AssessmentState): AssessmentState[] {
  const transitions: Record<AssessmentState, AssessmentState[]> = {
    initial: ['informed', 'closed'],
    informed: ['in_progress', 'closed'],
    in_progress: ['emergency', 'protection_special', 'orientation', 'optional_attachment', 'result', 'closed'],
    emergency: ['protection_special', 'orientation', 'result', 'closed'],
    protection_special: ['orientation', 'optional_attachment', 'result', 'closed'],
    orientation: ['optional_attachment', 'result', 'closed'],
    optional_attachment: ['result', 'closed'],
    result: ['closed'],
    closed: []
  };
  return transitions[from] || [];
}

/**
 * Check if state is terminal
 */
export function isTerminalState(state: AssessmentState): boolean {
  return state === 'closed';
}

/**
 * Check if state allows answers
 */
export function isAnswerableState(state: AssessmentState): boolean {
  return ['in_progress', 'emergency', 'protection_special', 'orientation', 'optional_attachment'].includes(state);
}

/**
 * Check if state allows attachments
 */
export function isAttachableState(state: AssessmentState): boolean {
  return ['optional_attachment', 'result'].includes(state);
}

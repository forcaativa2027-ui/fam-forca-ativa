import type { SupabaseClient } from "@supabase/supabase-js";
import jsonLogic from "json-logic-js";
type JSONLogic = unknown;

export interface FamRiskRule {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priority: number;
  condition: JSONLogic;
  actions: Record<string, unknown>;
  signals: Array<{ code: string; name: string; priority: number }> | null;
  signal_priority: number;
  special_flows: string[] | null;
  is_active: boolean;
}

export interface FamRiskSignal {
  id: string;
  risk_case_id: string;
  rule_code: string;
  signal_code: string;
  signal_name: string;
  priority: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface FamRiskQuestion {
  id: string;
  questionnaire_id: string;
  code: string;
  text: string;
  explanation: string | null;
  question_type: 'single_choice' | 'multiple_choice' | 'scale' | 'boolean';
  question_group: string;
  order_index: number;
  is_required: boolean;
  is_active: boolean;
  display_conditions: Record<string, unknown> | null;
  signal_weight: number;
}

export interface FamRiskAnswer {
  id: string;
  case_id: string;
  question_key: string;
  answer: string;
  created_at: string;
}

export interface FamRiskCase {
  id: string;
  public_reference: string;
  user_id: string | null;
  community_id: string | null;
  contact_name: string | null;
  consented_at: string;
  attention: 'immediate' | 'relevant' | 'specialized' | 'insufficient_information' | null;
  preliminary_summary: string | null;
  limitations_acknowledged_at: string | null;
  referred_conversation_id: string | null;
  methodology_version: string | null;
  questionnaire_version: string | null;
  text_version: string | null;
  policy_version: string | null;
  state: string;
  triggered_rules: string[];
  signals: Array<{ code: string; name: string; priority: number; rule_code: string }>;
  special_flows: string[];
  emergency_flag: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskEngineResult {
  state: string;
  attention: 'immediate' | 'relevant' | 'specialized' | 'insufficient_information' | null;
  emergency_flag: boolean;
  triggered_rules: Array<{ code: string; name: string; priority: number }>;
  signals: Array<{ code: string; name: string; priority: number; rule_code: string }>;
  special_flows: string[];
  preliminary_summary: string;
}

export interface RiskEngineContext {
  answers: Record<string, string>;
  userId?: string;
  caseId?: string;
}

/**
 * JSON Logic evaluator wrapper
 */
function evaluateCondition(condition: unknown, data: Record<string, unknown>): boolean {
  try {
    return jsonLogic.apply(condition as any, data) as boolean;
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}

/**
 * Risk Engine Service
 * Core service that processes answers through rules engine
 */
export class RiskEngine {
  private sb: SupabaseClient;
  private rulesCache: FamRiskRule[] | null = null;
  private questionsCache: FamRiskQuestion[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(sb: SupabaseClient) {
    this.sb = sb;
  }

  /**
   * Load and cache active rules
   */
  private async loadRules(): Promise<FamRiskRule[]> {
    const now = Date.now();
    if (this.rulesCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.rulesCache;
    }

    const { data, error } = await this.sb
      .from("fam_risk_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (error) throw error;

    this.rulesCache = (data ?? []) as FamRiskRule[];
    this.cacheTimestamp = now;
    return this.rulesCache;
  }

  /**
   * Load and cache active questions
   */
  private async loadQuestions(): Promise<FamRiskQuestion[]> {
    const now = Date.now();
    if (this.questionsCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.questionsCache;
    }

    const { data: questionnaire } = await this.sb
      .from("fam_risk_questionnaires")
      .select("id")
      .eq("code", "AR-FAM")
      .eq("version", "1.0")
      .eq("is_active", true)
      .single();

    if (!questionnaire) return [];

    const { data, error } = await this.sb
      .from("fam_risk_questions")
      .select("*")
      .eq("questionnaire_id", questionnaire.id)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;

    this.questionsCache = (data ?? []) as FamRiskQuestion[];
    this.cacheTimestamp = Date.now();
    return this.questionsCache;
  }

  /**
   * Get active questionnaire
   */
  async getActiveQuestionnaire() {
    const { data, error } = await this.sb
      .from("fam_risk_questionnaires")
      .select("*")
      .eq("code", "AR-FAM")
      .eq("version", "1.0")
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get questions for questionnaire with options
   */
  async getQuestionsWithOptions(questionnaireId: string) {
    const { data: questions, error } = await this.sb
      .from("fam_risk_questions")
      .select(`
        *,
        options:fam_risk_question_options(*)
      `)
      .eq("questionnaire_id", questionnaireId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Array<FamRiskQuestion & { options: Array<{ id: string; question_id: string; value: string; label: string; order_index: number; signal_weight: number; signal_mapping: Record<string, unknown> }> }>;
  }

  /**
   * Evaluate display conditions for a question
   */
  evaluateDisplayConditions(question: FamRiskQuestion, answers: Record<string, unknown>): boolean {
    if (!question.display_conditions) return true;
    return evaluateCondition(question.display_conditions, answers);
  }

  /**
   * Get visible questions based on current answers
   */
  async getVisibleQuestions(answers: Record<string, unknown>): Promise<FamRiskQuestion[]> {
    const questions = await this.loadQuestions();
    return questions.filter(q => q.is_active && this.evaluateDisplayConditions(q, answers));
  }

  /**
   * Process answers through rules engine
   */
  async processAnswers(context: RiskEngineContext): Promise<RiskEngineResult> {
    const { answers, userId, caseId } = context;

    // Load rules
    const rules = await this.loadRules();
    
    // Prepare data for JSON Logic evaluation
    const data = { ...answers };
    
    // Track triggered rules and signals
    const triggeredRules: Array<{ code: string; name: string; priority: number }> = [];
    const signals: Array<{ code: string; name: string; priority: number; rule_code: string }> = [];
    const specialFlows: string[] = [];
    let emergencyFlag = false;
    let state = 'in_progress';
    let attention: RiskEngineResult['attention'] = 'insufficient_information';

    // Evaluate rules in priority order
    for (const rule of rules) {
      if (!rule.is_active) continue;

      const conditionMet = evaluateCondition(rule.condition, { ...data, ...answers });
      
      if (conditionMet) {
        // Rule triggered
        triggeredRules.push({
          code: rule.code,
          name: rule.name,
          priority: rule.priority
        });

        // Process signals
        if (rule.signals) {
          for (const signal of rule.signals) {
            signals.push({
              code: signal.code,
              name: signal.name,
              priority: signal.priority,
              rule_code: rule.code
            });
          }
        }

        // Process special flows
        if (rule.special_flows) {
          specialFlows.push(...rule.special_flows);
        }

        // Process actions
        if (rule.actions) {
          const actions = rule.actions as Record<string, unknown>;
          
          if (actions.set_emergency_flag === true) {
            emergencyFlag = true;
          }
          if (actions.set_state) {
            state = actions.set_state as string;
          }
          if (actions.set_special_flow) {
            specialFlows.push(actions.set_special_flow as string);
          }
          if (actions.set_state === 'emergency' || actions.set_emergency_flag === true) {
            emergencyFlag = true;
            state = 'emergency';
          }
        }

        // Update attention based on signal priority
        if (rule.signals) {
          for (const signal of rule.signals) {
            if (signal.priority >= 100) {
              attention = 'immediate';
            } else if (signal.priority >= 80 && attention !== 'immediate') {
              attention = 'relevant';
            } else if (signal.priority >= 50 && attention === 'insufficient_information') {
              attention = 'relevant';
            } else if (attention === 'insufficient_information') {
              attention = 'specialized';
            }
          }
        }
      }
    }

    // Determine attention if not set by rules
    if (attention === 'insufficient_information' && Object.keys(answers).length > 0) {
      attention = 'specialized';
    }

    // Generate preliminary summary
    const preliminarySummary = this.generateSummary(answers, signals, specialFlows, emergencyFlag);

    // Persist signals if caseId provided
    if (caseId) {
      await this.persistSignals(caseId, signals);
      await this.persistTriggeredRules(caseId, triggeredRules);
      await this.updateCaseState(caseId, state, emergencyFlag, signals, specialFlows);
    }

    return {
      state,
      attention,
      emergency_flag: emergencyFlag,
      triggered_rules: triggeredRules,
      signals,
      special_flows: [...new Set(specialFlows)],
      preliminary_summary: preliminarySummary,
    };
  }

  /**
   * Generate preliminary summary based on answers and signals
   */
  private generateSummary(
    answers: Record<string, string>,
    signals: Array<{ code: string; name: string; priority: number; rule_code: string }>,
    specialFlows: string[],
    emergencyFlag: boolean
  ): string {
    const affirmativeCount = Object.values(answers).filter(v => v === 'sim').length;
    const totalAnswered = Object.keys(answers).length;

    if (emergencyFlag) {
      return 'Sinais de emergência identificados. Prioridade: proteção imediata e acionamento de recursos de emergência.';
    }

    if (signals.some(s => s.priority >= 100)) {
      return 'Sinais de risco imediato identificados. Recomenda-se acionamento imediato de recursos de proteção e emergência.';
    }

    if (signals.some(s => s.priority >= 80)) {
      return 'Sinais de risco relevantes identificados. Recomenda-se acompanhamento especializado e elaboração de plano de segurança.';
    }

    if (signals.some(s => s.priority >= 50)) {
      return 'Sinais de risco relevantes identificados. Recomenda-se acompanhamento especializado.';
    }

    if (totalAnswered > 0 && affirmativeCount === 0) {
      return 'Não foram identificados sinais de risco com base nas respostas fornecidas. Isso não significa ausência de risco. Converse com uma atendente especializada.';
    }

    return 'Avaliação em andamento. Continue respondendo para uma análise mais completa.';
  }

  /**
   * Persist signals to database
   */
  private async persistSignals(caseId: string, signals: Array<{ code: string; name: string; priority: number; rule_code: string }>) {
    if (signals.length === 0) return;

    const rows = signals.map(s => ({
      risk_case_id: caseId,
      rule_code: s.rule_code,
      signal_code: s.code,
      signal_name: s.name,
      priority: s.priority,
      details: { rule_code: s.rule_code }
    }));

    const { error } = await this.sb
      .from("fam_risk_signals")
      .upsert(rows, { onConflict: "risk_case_id,signal_code,rule_code" });

    if (error) console.error('Error persisting signals:', error);
  }

  /**
   * Persist triggered rules to database
   */
  private async persistTriggeredRules(caseId: string, rules: Array<{ code: string; name: string; priority: number }>) {
    if (rules.length === 0) return;

    // Store in risk_case triggered_rules field
    const ruleCodes = rules.map(r => r.code);
    
    const { error } = await this.sb
      .from("fam_risk_cases")
      .update({ triggered_rules: ruleCodes })
      .eq("id", caseId);

    if (error) console.error('Error updating triggered rules:', error);
  }

  /**
   * Update case state
   */
  private async updateCaseState(
    caseId: string,
    state: string,
    emergencyFlag: boolean,
    signals: Array<{ code: string; name: string; priority: number; rule_code: string }>,
    specialFlows: string[]
  ) {
    const signalCodes = signals.map(s => s.code);
    const signalNames = signals.map(s => s.name);
    const signalPriorities = signals.map(s => s.priority);

    const { error } = await this.sb
      .from("fam_risk_cases")
      .update({
        state,
        emergency_flag: emergencyFlag,
        signals: signals.map(s => ({ code: s.code, name: s.name, priority: s.priority, rule_code: s.rule_code })),
        special_flows: [...new Set(specialFlows)],
        updated_at: new Date().toISOString()
      })
      .eq("id", caseId);

    if (error) console.error('Error updating case state:', error);
  }

  /**
   * Record state transition
   */
  async recordStateTransition(
    caseId: string,
    fromState: string | null,
    toState: string,
    reasonCode: string | null,
    ruleCode: string | null,
    triggeredBy: 'user_answer' | 'rule_engine' | 'manual' | 'system',
    metadata: Record<string, unknown> = {}
  ) {
    const { error } = await this.sb
      .from("fam_assessment_state_history")
      .insert({
        risk_case_id: caseId,
        from_state: fromState,
        to_state: toState,
        reason_code: reasonCode,
        rule_code: ruleCode,
        triggered_by: triggeredBy,
        metadata
      });

    if (error) console.error('Error recording state transition:', error);
  }

  /**
   * Get risk case with full details
   */
  async getRiskCaseFull(caseId: string) {
    const { data, error } = await this.sb
      .from("fam_risk_cases")
      .select(`
        *,
        answers:fam_risk_answers(*),
        signals:fam_risk_signals(*),
        state_history:fam_assessment_state_history(*)
      `)
      .eq("id", caseId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete assessment
   */
  async completeAssessment(
    caseId: string,
    assessment: {
      attention: 'immediate' | 'relevant' | 'specialized' | 'insufficient_information';
      preliminary_summary: string;
      limitations_acknowledged_at: string;
      referred_conversation_id?: string;
    }
  ) {
    const { data, error } = await this.sb
      .from("fam_risk_cases")
      .update({
        ...assessment,
        state: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", caseId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.rulesCache = null;
    this.questionsCache = null;
    this.cacheTimestamp = 0;
  }
}

/**
 * Factory function to create RiskEngine instance
 */
export function createRiskEngine(sb: SupabaseClient): RiskEngine {
  return new RiskEngine(sb);
}

/**
 * Helper to create risk engine with Supabase client from context
 */
export async function getRiskEngine(): Promise<RiskEngine> {
  const { supabase } = await import("@/lib/supabase/client");
  return new RiskEngine(supabase as any);
}

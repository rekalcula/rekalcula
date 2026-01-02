// lib/ai-usage-logger.ts
// Helper para registrar uso de Claude AI con costos reales

import { supabase } from './supabase'

// Precios de Claude 3.5 Haiku (actualizados - Enero 2025)
const PRICING = {
  'claude-3-5-haiku-20241022': {
    input: 0.80 / 1_000_000,
    output: 4.00 / 1_000_000,
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00 / 1_000_000,
    output: 15.00 / 1_000_000,
  },
}

const USD_TO_EUR = 0.92

export interface AIUsageData {
  userId?: string
  operationType: 'invoice' | 'ticket' | 'analysis'
  inputTokens: number
  outputTokens: number
  model?: string
  success?: boolean
  errorMessage?: string
  processingTimeMs?: number
}

export async function logAIUsage(usage: AIUsageData): Promise<string | null> {
  try {
    const model = usage.model || 'claude-3-5-haiku-20241022'
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-3-5-haiku-20241022']

    const inputCostUSD = usage.inputTokens * pricing.input
    const outputCostUSD = usage.outputTokens * pricing.output

    const inputCostEUR = inputCostUSD * USD_TO_EUR
    const outputCostEUR = outputCostUSD * USD_TO_EUR

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: usage.userId || null,
        operation_type: usage.operationType,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        input_cost: inputCostEUR,
        output_cost: outputCostEUR,
        model: model,
        success: usage.success !== false,
        error_message: usage.errorMessage || null,
        processing_time_ms: usage.processingTimeMs || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error logging AI usage:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Unexpected error logging AI usage:', error)
    return null
  }
}

export function calculateAICost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'claude-3-5-haiku-20241022'
): { costUSD: number; costEUR: number } {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-3-5-haiku-20241022']

  const inputCostUSD = inputTokens * pricing.input
  const outputCostUSD = outputTokens * pricing.output
  const totalCostUSD = inputCostUSD + outputCostUSD

  const totalCostEUR = totalCostUSD * USD_TO_EUR

  return {
    costUSD: totalCostUSD,
    costEUR: totalCostEUR,
  }
}

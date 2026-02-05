import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationBudgetRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationBudget', 0.4);
  }

  isEligible(context: ScoringContext<Accommodation, UserPreferences>): boolean {
    const price = context.entity.priceInCents / 100;
    const { budgetAccommodationMin, budgetAccommodationMax } = context.userPreferences;
    
    // Se não houver budget definido, aceita qualquer preço
    if (!budgetAccommodationMin || !budgetAccommodationMax) {
      return true;
    }
    
    // Aceita até 20% acima do budget
    const maxAcceptable = budgetAccommodationMax * 1.2;
    return price >= budgetAccommodationMin && price <= maxAcceptable;
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
    const price = context.entity.priceInCents / 100;
    const { budgetAccommodationMin, budgetAccommodationMax } = context.userPreferences;

    // Se não houver budget, retorna score neutro
    if (!budgetAccommodationMin || !budgetAccommodationMax) {
      return 50;
    }

    // Muito abaixo do budget (pode ser suspeito)
    if (price < budgetAccommodationMin) {
      const diff = budgetAccommodationMin - price;
      const penalty = (diff / budgetAccommodationMin) * 70;
      return this.normalize(70 - penalty);
    }

    // Acima do budget (penalidade progressiva)
    if (price > budgetAccommodationMax) {
      const diff = price - budgetAccommodationMax;
      const penalty = (diff / budgetAccommodationMax) * 70;
      return this.normalize(30 - penalty, 0);
    }

    // Dentro do budget: melhor score para valores no meio da faixa
    const midpoint = (budgetAccommodationMin + budgetAccommodationMax) / 2;
    const range = budgetAccommodationMax - budgetAccommodationMin;
    const distanceFromMid = Math.abs(price - midpoint);
    const score = 100 - (distanceFromMid / range) * 30;

    return this.normalize(score);
  }
}
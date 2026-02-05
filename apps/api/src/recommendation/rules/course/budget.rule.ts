import { Injectable } from '@nestjs/common';
import { Course, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseBudgetRule extends BaseScoringRule<Course, UserPreferences> {
  constructor() {
    super('CourseBudget', 0.4);
  }

  isEligible(context: ScoringContext<Course, UserPreferences>): boolean {
    const priceInCents = context.entity.priceInCents;
    const { budgetCourseMin, budgetCourseMax } = context.userPreferences;
    
    // Se não houver preço ou budget definido, aceita
    if (!priceInCents || !budgetCourseMin || !budgetCourseMax) {
      return true;
    }
    
    const price = priceInCents / 100;
    const maxAcceptable = budgetCourseMax * 1.2;
    return price >= budgetCourseMin && price <= maxAcceptable;
  }

  calculate(context: ScoringContext<Course, UserPreferences>): number {
    const priceInCents = context.entity.priceInCents;
    const { budgetCourseMin, budgetCourseMax } = context.userPreferences;

    // Se não houver preço ou budget, retorna score neutro
    if (!priceInCents || !budgetCourseMin || !budgetCourseMax) {
      return 50;
    }

    const price = priceInCents / 100;

    if (price < budgetCourseMin) {
      const diff = budgetCourseMin - price;
      const penalty = (diff / budgetCourseMin) * 70;
      return this.normalize(70 - penalty);
    }

    if (price > budgetCourseMax) {
      const diff = price - budgetCourseMax;
      const penalty = (diff / budgetCourseMax) * 70;
      return this.normalize(30 - penalty, 0);
    }

    const midpoint = (budgetCourseMin + budgetCourseMax) / 2;
    const range = budgetCourseMax - budgetCourseMin;
    const distanceFromMid = Math.abs(price - midpoint);
    const score = 100 - (distanceFromMid / range) * 30;

    return this.normalize(score);
  }
}
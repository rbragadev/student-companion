import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class SchoolLocationRule extends BaseScoringRule<School, UserPreferences> {
  constructor() {
    super('SchoolLocation', 0.2);
  }

  calculate(context: ScoringContext<School, UserPreferences>): number {
    const destinationCity = context.userPreferences.destinationCity;
    
    if (!destinationCity) {
      return 50; // Neutro se usuário não tem destino definido
    }
    
    // Verifica se a localização da escola contém a cidade de destino
    const schoolLocation = context.entity.location || '';
    
    const isMatch = schoolLocation.toLowerCase().includes(destinationCity.toLowerCase());
    
    return isMatch ? 100 : 30;
  }
}

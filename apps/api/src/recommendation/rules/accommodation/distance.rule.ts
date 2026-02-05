import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationDistanceRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationDistance', 0.15);
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
    // TODO: Calcular distância real quando tivermos lat/long
    // Por enquanto, retorna score neutro pois distanceToSchool não existe no schema
    const maxDistance = context.userPreferences.maxDistanceToSchool ?? 10;

    // Verificar se temos lat/long para calcular distância futuramente
    if (context.entity.latitude && context.entity.longitude) {
      // TODO: Implementar cálculo de distância usando Haversine formula
      // const distance = this.calculateDistance(
      //   context.entity.latitude,
      //   context.entity.longitude,
      //   schoolLatitude,
      //   schoolLongitude
      // );
      return 50; // Score neutro por enquanto (não penaliza nem bonifica)
    }

    return 50; // Score neutro se não houver dados de localização
  }

  // TODO: Implementar quando tivermos coordenadas da escola do usuário
  // private calculateDistance(
  //   lat1: Decimal,
  //   lon1: Decimal,
  //   lat2: number,
  //   lon2: number
  // ): number {
  //   // Haversine formula
  //   const R = 6371; // Raio da Terra em km
  //   const dLat = this.toRad(lat2 - Number(lat1));
  //   const dLon = this.toRad(lon2 - Number(lon1));
  //   const a =
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(this.toRad(Number(lat1))) *
  //       Math.cos(this.toRad(lat2)) *
  //       Math.sin(dLon / 2) *
  //       Math.sin(dLon / 2);
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //   return R * c;
  // }
  //
  // private toRad(degrees: number): number {
  //   return degrees * (Math.PI / 180);
  // }
}
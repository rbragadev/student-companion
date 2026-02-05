/**
 * Utilitários para formatação de dados vindos da API
 */

/**
 * Formata preço de cents para display
 * @param priceInCents - Preço em centavos
 * @param currency - Moeda (padrão CAD)
 * @returns Preço formatado (ex: "CAD 1,150")
 */
export const formatPrice = (priceInCents: number, currency: string = 'CAD'): string => {
  const dollars = priceInCents / 100;
  return `${currency} ${dollars.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Formata distância de km para display
 * @param distanceKm - Distância em quilômetros
 * @returns Distância formatada (ex: "2.5 km" ou "500 m")
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Formata rating para display
 * @param rating - Rating de 0-5
 * @returns Rating formatado (ex: "4.5")
 */
export const formatRating = (rating?: number): string => {
  if (!rating) return '—';
  return rating.toFixed(1);
};

/**
 * Extrai preço do subtitle da recomendação (sem o /unit)
 * @param subtitle - Subtitle da recomendação (ex: "Vancouver • $950/month")
 * @returns Preço extraído (ex: "$950")
 */
export const extractPriceFromSubtitle = (subtitle: string): string => {
  const parts = subtitle.split('•');
  const priceWithUnit = parts[1]?.trim() || '';
  // Remove o /unit do final (ex: "$950/month" -> "$950")
  return priceWithUnit.split('/')[0]?.trim() || '';
};

/**
 * Formata tempo estimado de distância
 * @param distanceKm - Distância em km
 * @param mode - Modo de transporte (walk, transit, drive)
 * @returns Tempo estimado (ex: "20 min walk")
 */
export const estimateTravelTime = (
  distanceKm: number,
  mode: 'walk' | 'transit' | 'drive' = 'walk',
): string => {
  const speeds = {
    walk: 5, // km/h
    transit: 25, // km/h
    drive: 40, // km/h
  };

  const hours = distanceKm / speeds[mode];
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
};

/**
 * Formata accommodation type para display
 * @param type - Tipo de acomodação
 * @returns Tipo formatado
 */
export const formatAccommodationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    homestay: 'Homestay',
    shared: 'Shared Apartment',
    studio: 'Studio',
    apartment: 'Apartment',
    house: 'House',
  };

  return typeMap[type.toLowerCase()] || type;
};

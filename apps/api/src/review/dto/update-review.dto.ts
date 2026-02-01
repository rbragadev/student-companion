import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';

// Apenas rating e comment podem ser atualizados
// userId, reviewableType e reviewableId não devem mudar após criação
export class UpdateReviewDto extends PartialType(
  OmitType(CreateReviewDto, ['userId', 'reviewableType', 'reviewableId'] as const),
) {}

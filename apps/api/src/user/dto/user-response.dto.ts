export class DestinationDto {
  city: string;
  country: string;
}

export class BudgetDto {
  accommodation?: string;
  course?: string;
}

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  destination: DestinationDto;
  purpose: string;
  budget?: BudgetDto;
  englishLevel?: string;
  arrivalDate?: string;
  hasUnreadNotifications: boolean;
  notificationCount: number;
}

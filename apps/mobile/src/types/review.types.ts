export interface Review {
  id: string;
  userId: string;
  reviewableType: 'COURSE' | 'ACCOMMODATION' | 'PLACE';
  reviewableId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

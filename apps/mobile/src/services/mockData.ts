// Mock API Data - Será substituído por chamadas reais posteriormente

export interface UserInterest {
  id: string;
  type: 'accommodation' | 'course';
  title: string;
  subtitle: string;
  date: string;
  status: 'pending' | 'contacted' | 'closed';
}

export interface CopilotRecommendation {
  id: string;
  type: 'accommodation' | 'course';
  title: string;
  subtitle: string;
  image: string;
  price?: string;
  rating?: number;
  highlights: string[];
}

export interface CopilotResponse {
  summary: string;
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  recommendations: CopilotRecommendation[];
  confidence: 'high' | 'medium' | 'low';
  missingInfo?: string[];
}

export interface HeroContent {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaIntent: 'accommodation' | 'courses' | 'general';
}

// Simula uma chamada à API que retorna interesses/leads do usuário
export const getUserInterests = async (): Promise<UserInterest[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return [
    {
      id: '1',
      type: 'accommodation',
      title: 'Cozy Homestay in Vancouver',
      subtitle: 'Sent inquiry on Jan 15, 2026',
      date: '2026-01-15',
      status: 'pending',
    },
    {
      id: '2',
      type: 'course',
      title: 'ILSC Vancouver - General English',
      subtitle: 'Enrollment request sent',
      date: '2026-01-20',
      status: 'contacted',
    },
    {
      id: '3',
      type: 'accommodation',
      title: 'Modern Studio Downtown',
      subtitle: 'Application completed',
      date: '2026-01-10',
      status: 'closed',
    },
  ];
};

// Simula uma chamada à API que retorna o conteúdo do Hero Card
export const getHeroContent = async (): Promise<HeroContent> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    image: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&h=600&fit=crop',
    title: 'Find the best accommodation for your profile',
    subtitle: 'Based on your budget, location and school',
    ctaText: 'Get recommendations',
    ctaIntent: 'accommodation',
  };
};

// Hook para usar o conteúdo do Hero Card
export const useHeroContent = () => {
  const [content, setContent] = React.useState<HeroContent | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getHeroContent().then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, []);

  return { content, loading };
};

// Exporta React para os hooks
import React from 'react';

// Hook para usar interesses do usuário
export const useUserInterests = () => {
  const [interests, setInterests] = React.useState<UserInterest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getUserInterests().then((data) => {
      setInterests(data);
      setLoading(false);
    });
  }, []);

  return { interests, loading };
};

// Simula uma chamada à API do Copilot
const getCopilotResponse = async (question: string): Promise<CopilotResponse> => {
  // Simula delay de IA
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Detecta o tipo de pergunta e retorna resposta apropriada
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes('morar') ||
    lowerQuestion.includes('accommodation') ||
    lowerQuestion.includes('1200')
  ) {
    return {
      summary:
        'Based on your budget of CAD 1,200/month, you have good options in Vancouver. Homestays and shared accommodations are the most affordable choices, offering a balance between cost and comfort.',
      tradeoffs: {
        pros: [
          'Homestays include meals and utilities',
          'Shared houses offer more independence',
          'Both options help you save for other expenses',
          'Great way to meet other students',
        ],
        cons: [
          'Less privacy in shared spaces',
          'Homestay rules can be restrictive',
          'May need to commute to school',
          'Limited kitchen access in some homestays',
        ],
      },
      recommendations: [
        {
          id: '1',
          type: 'accommodation',
          title: 'Cozy Homestay in Vancouver',
          subtitle: 'Kitsilano • Meals included',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          price: 'CAD 950/month',
          rating: 4.7,
          highlights: ['3 meals/day', 'WiFi included', '20min to downtown'],
        },
        {
          id: '2',
          type: 'accommodation',
          title: 'Shared House Downtown',
          subtitle: 'West End • Fully furnished',
          image:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          price: 'CAD 1,150/month',
          rating: 4.5,
          highlights: ['Private bedroom', 'Shared kitchen', 'Walking distance to schools'],
        },
        {
          id: '3',
          type: 'accommodation',
          title: 'Student Residence',
          subtitle: 'Mount Pleasant • All utilities',
          image:
            'https://images.unsplash.com/photo-1502672260066-6bc36a0d5c01?w=400&h=300&fit=crop',
          price: 'CAD 1,200/month',
          rating: 4.6,
          highlights: ['Utilities included', 'Study lounge', 'International community'],
        },
      ],
      confidence: 'high',
    };
  }

  if (
    lowerQuestion.includes('escola') ||
    lowerQuestion.includes('school') ||
    lowerQuestion.includes('worth') ||
    lowerQuestion.includes('custo')
  ) {
    return {
      summary:
        'When choosing a school, consider factors beyond just price: teacher quality, class size, location, and student reviews are crucial. The best value schools offer a balance of affordability and quality education.',
      tradeoffs: {
        pros: [
          'Smaller schools offer personalized attention',
          'Partner schools provide exclusive deals',
          'Downtown locations save commute time',
          'Accredited schools ensure quality standards',
        ],
        cons: [
          'Premium schools can be expensive',
          'Cheaper schools may have larger classes',
          'Location affects overall cost of living',
          'Not all schools offer flexible schedules',
        ],
      },
      recommendations: [
        {
          id: '1',
          type: 'course',
          title: 'ILSC Vancouver',
          subtitle: 'General English - Full Time',
          image:
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
          price: 'CAD 1,450/month',
          rating: 4.8,
          highlights: ['28h/week', 'Small classes', 'Downtown location'],
        },
        {
          id: '2',
          type: 'course',
          title: 'VanWest College',
          subtitle: 'Business English',
          image:
            'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
          price: 'CAD 1,320/month',
          rating: 4.7,
          highlights: ['25h/week', 'Career focused', 'Student discounts'],
        },
        {
          id: '3',
          type: 'course',
          title: 'ILAC Vancouver',
          subtitle: 'Pathway Program',
          image:
            'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop',
          price: 'CAD 1,890/month',
          rating: 4.8,
          highlights: ['38h/week', 'University pathway', 'Intensive program'],
        },
      ],
      confidence: 'high',
    };
  }

  if (lowerQuestion.includes('homestay') && lowerQuestion.includes('shared')) {
    return {
      summary:
        'Both options have their merits. Homestays are ideal for cultural immersion and included meals, while shared houses offer more independence and flexibility. Your choice depends on your lifestyle preferences and budget.',
      tradeoffs: {
        pros: [
          'Homestay: Cultural immersion and language practice',
          'Homestay: Meals and utilities typically included',
          'Shared: More independence and flexibility',
          'Shared: Often closer to nightlife and student areas',
        ],
        cons: [
          'Homestay: House rules and curfews',
          'Homestay: Less social interaction with peers',
          'Shared: Need to cook and clean',
          'Shared: Utility bills not always included',
        ],
      },
      recommendations: [
        {
          id: '1',
          type: 'accommodation',
          title: 'Premium Homestay',
          subtitle: 'North Vancouver • Full board',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          price: 'CAD 1,100/month',
          rating: 4.8,
          highlights: ['All meals', 'Private room', 'Quiet neighborhood'],
        },
        {
          id: '2',
          type: 'accommodation',
          title: 'Modern Shared House',
          subtitle: 'Kitsilano • Beachside',
          image:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          price: 'CAD 1,250/month',
          rating: 4.6,
          highlights: ['Near beach', '4 roommates', 'Fully equipped'],
        },
        {
          id: '3',
          type: 'accommodation',
          title: 'Hybrid Option',
          subtitle: 'West End • Best of both',
          image:
            'https://images.unsplash.com/photo-1502672260066-6bc36a0d5c01?w=400&h=300&fit=crop',
          price: 'CAD 1,180/month',
          rating: 4.7,
          highlights: ['Breakfast included', 'Independent living', 'Central location'],
        },
      ],
      confidence: 'high',
    };
  }

  // Resposta genérica com baixa confiança
  return {
    summary:
      'I need more information to give you the best recommendations. Please provide more details about your preferences and situation.',
    tradeoffs: {
      pros: [],
      cons: [],
    },
    recommendations: [],
    confidence: 'low',
    missingInfo: [
      'What is your monthly budget?',
      'Are you looking for accommodation or courses?',
      'What area of Vancouver do you prefer?',
      'Do you have any specific requirements?',
    ],
  };
};

// Export da função para ser usada diretamente
export const askCopilot = getCopilotResponse;

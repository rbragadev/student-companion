import 'dotenv/config';

import { PrismaClient, RecordStatus, Role, Shift } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined.');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const ids = {
  users: {
    raphael: 'a8ee8202-7adb-48d9-a2c7-6a03ffc75b48',
    emily: '97d7fe11-44d2-4daf-99d0-f2b462e91f2d',
    lucas: '7f15be1f-3c9d-4d2d-8b2f-0bc8f1df74b2',
    admin: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
    superAdmin: 'c2d3e4f5-a6b7-8901-bcde-f12345678901',
    operador: 'd3e4f5a6-b7c8-9012-cdef-123456789012',
  },
  preferences: {
    raphael: '7a8d0b4f-03c0-4633-8070-f334d2831bf1',
    emily: '16c370b1-1824-4bdd-a5a5-ed28617b6408',
    lucas: '4b5c6d7e-8f91-4a32-b4c5-7d7c6128f12a',
  },
  schools: {
    ilsc: '3bf8b3bf-8420-46c4-b2d6-17f46be8322e',
    vgc: '2036e73f-1f1d-4c66-9db8-2f4287d2fd80',
    cornerstone: 'd17a5348-4104-4266-919c-647e7279d6ab',
  },
  institutions: {
    global: '11111111-1111-4111-8111-111111111111',
    exchange: '22222222-2222-4222-8222-222222222222',
  },
  units: {
    downtown: '33333333-3333-4333-8333-333333333333',
    burnaby: '44444444-4444-4444-8444-444444444444',
    toronto: '55555555-5555-4555-8555-555555555555',
  },
  academicPeriods: {
    spring2026: '66666666-6666-4666-8666-666666666666',
    fall2026: '77777777-7777-4777-8777-777777777777',
    winter2027: '99999999-9999-4999-8999-999999999999',
  },
  classGroups: {
    engA1Morning: '88888888-8888-4888-8888-888888888881',
    engB2Evening: '88888888-8888-4888-8888-888888888882',
    businessAfternoon: '88888888-8888-4888-8888-888888888883',
  },
  enrollmentIntents: {
    raphael: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    emily: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    lucas: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  },
  enrollments: {
    emily: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  },
  courses: {
    generalEnglishIlsc: 'd0efb89f-3d37-4607-9eaa-032832ec2b8e',
    businessEnglishIlsc: '4e36abbb-ecf2-4e3b-8104-c74eefb8bb07',
    ieltsVgc: '9aa7f94d-23f4-4ec8-9cda-0fc7dca634b9',
    speakingVgc: '29c48c6a-a129-4cc6-8c87-a281d4040d3a',
    hospitalityCornerstone: 'b90ded20-ed8e-4481-b2a0-177b47f45ec5',
    digitalMarketingCornerstone: '7c22b73e-3c98-4551-9162-652d739cb2e7',
  },
  accommodations: {
    kitsHomestay: '393d4c37-a7fd-4c98-a56b-0df5cd94c6f5',
    downtownShared: '7775c069-edee-4eb4-bde4-2d9717dca7cd',
    burnabyStudio: '33ef7287-aeb2-4578-92a5-6b576a49337a',
    richmondApartment: '042da955-4f16-4ff6-9c63-07ba0ce2c6e3',
    commercialShared: '5564658e-c078-49a8-a38e-aaeaa7d97a9f',
    gastownStudio: '09ed1b53-9ba9-4e7f-95b0-586f33fc5d60',
  },
  places: {
    breka: '6cfca43c-df2c-4d42-94a8-6f67d3d2cb9e',
    stanleyPark: '7f6247d1-9e55-42f5-bc24-7f81d019bbf3',
    granville: '2a900b9f-5c72-4c1a-af00-c0c04eb81195',
    scotiabarn: 'bfa6dc73-a100-4550-b31f-c3c6ba2e1f58',
    waterfrontGym: 'dc43b85e-4978-4d34-ba48-df851f7bfb36',
    japadog: '4f6a019a-1b03-4d4d-85e4-803cbd7f10dc',
  },
  reviews: {
    course1: '2964c6d6-18c5-4f2f-8fa3-7f584fca7f84',
    course2: '0df8b60e-5b38-4be2-b375-dceec32f65d2',
    accommodation1: '5c2c32d2-b0d6-4cbc-a7a5-85efea10c298',
    accommodation2: '42102bc2-cbcb-4fe9-97b7-11f5c1ca31f8',
    place1: '6a26255f-6d0e-41c1-b17c-cdce43e0c10f',
    place2: '9d20be8f-8f1f-4dbf-bb96-00f43467e225',
  },
} as const;

async function main() {
  const passwordHash = await bcrypt.hash('senha123', 10);

  await prisma.user.createMany({
    data: [
      {
        id: ids.users.raphael,
        firstName: 'Raphael',
        lastName: 'Braga',
        email: 'raphael@studentcompanion.dev',
        phone: '+55 11 99999-0001',
        avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Raphael',
        studentStatus: 'lead',
        passwordHash,
      },
      {
        id: ids.users.emily,
        firstName: 'Emily',
        lastName: 'Chen',
        email: 'emily@studentcompanion.dev',
        phone: '+1 604 555 1002',
        avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Emily',
        studentStatus: 'enrolled',
        passwordHash,
      },
      {
        id: ids.users.lucas,
        firstName: 'Lucas',
        lastName: 'Costa',
        email: 'lucas@studentcompanion.dev',
        phone: '+55 21 98888-4400',
        avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Lucas',
        studentStatus: 'application_started',
        passwordHash,
      },
      {
        id: ids.users.admin,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@studentcompanion.dev',
        avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=AdminUser',
        role: Role.ADMIN,
        passwordHash,
      },
      {
        id: ids.users.superAdmin,
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@studentcompanion.dev',
        avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=SuperAdmin',
        role: Role.SUPER_ADMIN,
        passwordHash,
      },
      {
        id: ids.users.operador,
        firstName: 'Operador',
        lastName: 'Base',
        email: 'operador@studentcompanion.dev',
        avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=OperadorBase',
        role: Role.ADMIN,
        passwordHash,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.userPreferences.createMany({
    data: [
      {
        id: ids.preferences.raphael,
        userId: ids.users.raphael,
        destinationCity: 'Vancouver',
        destinationCountry: 'Canada',
        budgetAccommodationMin: 900,
        budgetAccommodationMax: 1600,
        budgetCourseMin: 900,
        budgetCourseMax: 1800,
        purpose: 'study',
        englishLevel: 'intermediate',
        arrivalDate: new Date('2026-09-10T00:00:00.000Z'),
        preferredAccommodationTypes: ['Homestay', 'Shared'],
        maxDistanceToSchool: 8,
        hasUnreadNotifications: true,
        notificationCount: 3,
      },
      {
        id: ids.preferences.emily,
        userId: ids.users.emily,
        destinationCity: 'Vancouver',
        destinationCountry: 'Canada',
        budgetAccommodationMin: 1200,
        budgetAccommodationMax: 2200,
        budgetCourseMin: 1200,
        budgetCourseMax: 2500,
        purpose: 'college',
        englishLevel: 'advanced',
        arrivalDate: new Date('2026-08-20T00:00:00.000Z'),
        preferredAccommodationTypes: ['Studio', 'Apartment'],
        maxDistanceToSchool: 12,
        hasUnreadNotifications: false,
        notificationCount: 0,
      },
      {
        id: ids.preferences.lucas,
        userId: ids.users.lucas,
        destinationCity: 'Toronto',
        destinationCountry: 'Canada',
        budgetAccommodationMin: 700,
        budgetAccommodationMax: 1300,
        budgetCourseMin: 800,
        budgetCourseMax: 1500,
        purpose: 'language exchange',
        englishLevel: 'beginner',
        arrivalDate: new Date('2026-07-01T00:00:00.000Z'),
        preferredAccommodationTypes: ['Shared'],
        maxDistanceToSchool: 15,
        hasUnreadNotifications: true,
        notificationCount: 1,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.institution.createMany({
    data: [
      {
        id: ids.institutions.global,
        name: 'Global Education Group',
        description: 'Escopo administrativo (cliente SaaS) para operação de programas internacionais.',
      },
      {
        id: ids.institutions.exchange,
        name: 'Exchange Learning Network',
        description: 'Escopo administrativo (cliente SaaS) com foco em intercâmbio acadêmico.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.school.createMany({
    data: [
      {
        id: ids.schools.ilsc,
        institutionId: ids.institutions.global,
        name: 'ILSC Vancouver',
        location: 'Vancouver, BC',
        description: 'Escola de idiomas com foco em programas flexiveis para estudantes internacionais.',
        website: 'https://studentcompanion.dev/schools/ilsc-vancouver',
        phone: '+1 604 689 9095',
        email: 'hello+ilsc@studentcompanion.dev',
        logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
        isPartner: true,
        rating: 4.8,
        rating_count: 312,
        badges: ['Partner', 'Top Rated'],
      },
      {
        id: ids.schools.vgc,
        institutionId: ids.institutions.global,
        name: 'VanWest College Vancouver',
        location: 'Vancouver, BC',
        description: 'Programas intensivos de inglês, business communication e preparação acadêmica.',
        website: 'https://studentcompanion.dev/schools/vanwest-vancouver',
        phone: '+1 604 688 9057',
        email: 'hello+vanwest@studentcompanion.dev',
        logo: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        isPartner: true,
        rating: 4.6,
        rating_count: 204,
        badges: ['Popular'],
      },
      {
        id: ids.schools.cornerstone,
        institutionId: ids.institutions.exchange,
        name: 'ILAC Vancouver',
        location: 'Vancouver, BC',
        description: 'Trilhas intensivas de inglês e pathway para estudantes internacionais.',
        website: 'https://studentcompanion.dev/schools/ilac-vancouver',
        phone: '+1 604 620 1111',
        email: 'hello+ilac@studentcompanion.dev',
        logo: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
        isPartner: false,
        rating: 4.3,
        rating_count: 121,
        badges: ['Career Path'],
      },
    ],
    skipDuplicates: true,
  });

  await prisma.unit.createMany({
    data: [
      {
        id: ids.units.downtown,
        schoolId: ids.schools.ilsc,
        name: 'Unidade Downtown Vancouver',
        code: 'VAN-DT',
        address: '101 Burrard St',
        city: 'Vancouver',
        state: 'BC',
        country: 'Canada',
      },
      {
        id: ids.units.burnaby,
        schoolId: ids.schools.vgc,
        name: 'Unidade Burnaby',
        code: 'VAN-BBY',
        address: '4550 Kingsway',
        city: 'Burnaby',
        state: 'BC',
        country: 'Canada',
      },
      {
        id: ids.units.toronto,
        schoolId: ids.schools.cornerstone,
        name: 'Unidade Toronto Central',
        code: 'TOR-CTR',
        address: '250 Yonge St',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.course.createMany({
    data: [
      {
        id: ids.courses.generalEnglishIlsc,
        unitId: ids.units.downtown,
        school_id: ids.schools.ilsc,
        program_name: 'ILSC Vancouver - General English',
        weekly_hours: 30,
        price_in_cents: 135000,
        price_unit: 'week',
        description: 'Programa intensivo para evolucao consistente de speaking, listening e writing.',
        duration: '4-24 weeks',
        visa_type: 'Visitor Visa or Study Permit',
        target_audience: 'intermediate students',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Best Seller'],
        rating: 4.8,
        rating_count: 143,
        is_active: true,
      },
      {
        id: ids.courses.businessEnglishIlsc,
        unitId: ids.units.downtown,
        school_id: ids.schools.ilsc,
        program_name: 'ILSC Vancouver - Business English Communication',
        weekly_hours: 24,
        price_in_cents: 155000,
        price_unit: 'week',
        description: 'Curso para comunicacao profissional, entrevistas e ambiente corporativo.',
        duration: '8-16 weeks',
        visa_type: 'Visitor Visa or Study Permit',
        target_audience: 'intermediate and advanced students',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Career Focus'],
        rating: 4.6,
        rating_count: 91,
        is_active: true,
      },
      {
        id: ids.courses.ieltsVgc,
        unitId: ids.units.burnaby,
        school_id: ids.schools.vgc,
        program_name: 'VanWest College - Business English',
        weekly_hours: 28,
        price_in_cents: 145000,
        price_unit: 'week',
        description: 'Preparacao orientada para metas de IELTS academico e general training.',
        duration: '4-12 weeks',
        visa_type: 'Visitor Visa or Study Permit',
        target_audience: 'intermediate students',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Exam Prep'],
        rating: 4.7,
        rating_count: 88,
        is_active: true,
      },
      {
        id: ids.courses.speakingVgc,
        unitId: ids.units.burnaby,
        school_id: ids.schools.vgc,
        program_name: 'VanWest College - Speaking Confidence Lab',
        weekly_hours: 20,
        price_in_cents: 98000,
        price_unit: 'week',
        description: 'Foco total em fluencia, pronuncia e apresentacoes em ingles.',
        duration: '2-8 weeks',
        visa_type: 'Visitor Visa',
        target_audience: 'beginner and intermediate students',
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Budget Pick'],
        rating: 4.4,
        rating_count: 57,
        is_active: true,
      },
      {
        id: ids.courses.hospitalityCornerstone,
        unitId: ids.units.toronto,
        school_id: ids.schools.cornerstone,
        program_name: 'ILAC Vancouver - Pathway Program',
        weekly_hours: 30,
        price_in_cents: 185000,
        price_unit: 'month',
        description: 'Programa vocacional com co-op para entrada rapida no mercado local.',
        duration: '12 months',
        visa_type: 'Study Permit',
        target_audience: 'advanced students',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Co-op'],
        rating: 4.3,
        rating_count: 42,
        is_active: true,
      },
      {
        id: ids.courses.digitalMarketingCornerstone,
        unitId: ids.units.toronto,
        school_id: ids.schools.cornerstone,
        program_name: 'Digital Marketing Diploma',
        weekly_hours: 26,
        price_in_cents: 175000,
        price_unit: 'month',
        description: 'Diploma com foco em social media, analytics e campanhas pagas.',
        duration: '12 months',
        visa_type: 'Study Permit',
        target_audience: 'intermediate and advanced students',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Trending'],
        rating: 4.5,
        rating_count: 36,
        is_active: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.classGroup.createMany({
    data: [
      {
        id: ids.classGroups.engA1Morning,
        courseId: ids.courses.generalEnglishIlsc,
        name: 'English Starter A1',
        code: 'ENG-A1-01',
        shift: Shift.MORNING,
        status: RecordStatus.ACTIVE,
        capacity: 24,
      },
      {
        id: ids.classGroups.engB2Evening,
        courseId: ids.courses.ieltsVgc,
        name: 'English B2 Fluency',
        code: 'ENG-B2-05',
        shift: Shift.EVENING,
        status: RecordStatus.ACTIVE,
        capacity: 20,
      },
      {
        id: ids.classGroups.businessAfternoon,
        courseId: ids.courses.digitalMarketingCornerstone,
        name: 'Business English Foundations',
        code: 'BUS-EN-03',
        shift: Shift.AFTERNOON,
        status: RecordStatus.INACTIVE,
        capacity: 18,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.academicPeriod.createMany({
    data: [
      {
        id: ids.academicPeriods.spring2026,
        classGroupId: ids.classGroups.businessAfternoon,
        name: 'Spring 2026',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T00:00:00.000Z'),
        status: RecordStatus.INACTIVE,
      },
      {
        id: ids.academicPeriods.fall2026,
        classGroupId: ids.classGroups.engA1Morning,
        name: 'Fall 2026',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-12-20T00:00:00.000Z'),
        status: RecordStatus.ACTIVE,
      },
      {
        id: ids.academicPeriods.winter2027,
        classGroupId: ids.classGroups.engB2Evening,
        name: 'Winter 2027',
        startDate: new Date('2027-01-05T00:00:00.000Z'),
        endDate: new Date('2027-03-20T00:00:00.000Z'),
        status: RecordStatus.ACTIVE,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.enrollmentIntent.createMany({
    data: [
      {
        id: ids.enrollmentIntents.raphael,
        studentId: ids.users.raphael,
        courseId: ids.courses.generalEnglishIlsc,
        classGroupId: ids.classGroups.engA1Morning,
        academicPeriodId: ids.academicPeriods.fall2026,
        status: 'pending',
      },
      {
        id: ids.enrollmentIntents.emily,
        studentId: ids.users.emily,
        courseId: ids.courses.ieltsVgc,
        classGroupId: ids.classGroups.engB2Evening,
        academicPeriodId: ids.academicPeriods.winter2027,
        status: 'converted',
        convertedAt: new Date('2026-04-10T00:00:00.000Z'),
      },
      {
        id: ids.enrollmentIntents.lucas,
        studentId: ids.users.lucas,
        courseId: ids.courses.digitalMarketingCornerstone,
        classGroupId: ids.classGroups.businessAfternoon,
        academicPeriodId: ids.academicPeriods.spring2026,
        status: 'pending',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.enrollment.createMany({
    data: [
      {
        id: ids.enrollments.emily,
        studentId: ids.users.emily,
        institutionId: ids.institutions.global,
        schoolId: ids.schools.vgc,
        unitId: ids.units.burnaby,
        courseId: ids.courses.ieltsVgc,
        classGroupId: ids.classGroups.engB2Evening,
        academicPeriodId: ids.academicPeriods.winter2027,
        enrollmentIntentId: ids.enrollmentIntents.emily,
        status: 'active',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.accommodation.createMany({
    data: [
      {
        id: ids.accommodations.kitsHomestay,
        title: 'Cozy Homestay in Vancouver',
        accommodationType: 'Homestay',
        priceInCents: 120000,
        priceUnit: 'month',
        location: 'Vancouver, BC',
        areaHint: 'Kitsilano',
        latitude: 49.2684,
        longitude: -123.1686,
        description: 'Casa familiar com cafe da manha e jantar incluidos, ideal para primeira experiencia no Canada.',
        rules: ['No smoking', 'Quiet hours after 10pm'],
        amenities: ['Wi-Fi', 'Laundry', 'Meals included', 'Desk'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        ],
        rating: 4.9,
        ratingCount: 87,
        ratingCleanliness: 4.8,
        ratingLocation: 4.7,
        ratingCommunication: 4.9,
        ratingValue: 4.8,
        badges: ['Top Trip', 'Meals Included'],
        isPartner: true,
        isTopTrip: true,
        hostName: 'Susan Miller',
        hostAvatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Susan',
        isActive: true,
      },
      {
        id: ids.accommodations.downtownShared,
        title: 'Modern Studio Downtown',
        accommodationType: 'Shared',
        priceInCents: 110000,
        priceUnit: 'month',
        location: 'Vancouver, BC',
        areaHint: 'Downtown',
        latitude: 49.2827,
        longitude: -123.1207,
        description: 'Quarto privado em loft moderno perto de estacoes e escolas.',
        rules: ['No parties', 'Guests until 11pm'],
        amenities: ['Wi-Fi', 'Gym', 'Study lounge'],
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        ],
        rating: 4.7,
        ratingCount: 65,
        ratingCleanliness: 4.6,
        ratingLocation: 5.0,
        ratingCommunication: 4.5,
        ratingValue: 4.7,
        badges: ['Student Favorite'],
        isPartner: true,
        isTopTrip: false,
        hostName: 'Mark Johnson',
        hostAvatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Mark',
        isActive: true,
      },
      {
        id: ids.accommodations.burnabyStudio,
        title: 'Burnaby Budget Studio',
        accommodationType: 'Studio',
        priceInCents: 95000,
        priceUnit: 'month',
        location: 'Burnaby, BC',
        areaHint: 'Metrotown',
        latitude: 49.2276,
        longitude: -123.0076,
        description: 'Studio compacto com excelente custo-beneficio perto do SkyTrain.',
        rules: ['No pets'],
        amenities: ['Wi-Fi', 'Kitchenette', 'Heating'],
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
        ],
        rating: 4.3,
        ratingCount: 49,
        ratingCleanliness: 4.3,
        ratingLocation: 4.1,
        ratingCommunication: 4.4,
        ratingValue: 4.8,
        badges: ['Budget Pick'],
        isPartner: false,
        isTopTrip: false,
        hostName: 'Anna Lee',
        hostAvatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Anna',
        isActive: true,
      },
      {
        id: ids.accommodations.richmondApartment,
        title: 'Richmond Modern Apartment',
        accommodationType: 'Apartment',
        priceInCents: 175000,
        priceUnit: 'month',
        location: 'Richmond, BC',
        areaHint: 'Brighouse',
        latitude: 49.1666,
        longitude: -123.1336,
        description: 'Apartamento completo para quem quer mais privacidade e estrutura.',
        rules: ['No smoking', 'Building rules apply'],
        amenities: ['Wi-Fi', 'Parking', 'In-unit laundry'],
        image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
        ],
        rating: 4.5,
        ratingCount: 28,
        ratingCleanliness: 4.7,
        ratingLocation: 4.0,
        ratingCommunication: 4.5,
        ratingValue: 4.1,
        badges: ['Private Space'],
        isPartner: false,
        isTopTrip: false,
        hostName: 'Kevin Wu',
        hostAvatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Kevin',
        isActive: true,
      },
      {
        id: ids.accommodations.commercialShared,
        title: 'Commercial Drive Shared House',
        accommodationType: 'Shared',
        priceInCents: 130000,
        priceUnit: 'month',
        location: 'Vancouver, BC',
        areaHint: 'Commercial Drive',
        latitude: 49.2733,
        longitude: -123.0693,
        description: 'Casa estudantil com ambiente social e facil acesso ao centro.',
        rules: ['Respect shared spaces', 'No overnight guests'],
        amenities: ['Wi-Fi', 'Backyard', 'Laundry', 'Bike storage'],
        image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80',
        ],
        rating: 4.6,
        ratingCount: 52,
        ratingCleanliness: 4.4,
        ratingLocation: 4.5,
        ratingCommunication: 4.6,
        ratingValue: 4.7,
        badges: ['Near Transit'],
        isPartner: false,
        isTopTrip: true,
        hostName: 'Julia Brown',
        hostAvatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Julia',
        isActive: true,
      },
      {
        id: ids.accommodations.gastownStudio,
        title: 'Gastown Premium Studio',
        accommodationType: 'Studio',
        priceInCents: 210000,
        priceUnit: 'month',
        location: 'Vancouver, BC',
        areaHint: 'Gastown',
        latitude: 49.2830,
        longitude: -123.1060,
        description: 'Studio premium para quem prioriza localizacao e acabamento.',
        rules: ['No smoking'],
        amenities: ['Wi-Fi', 'Concierge', 'Gym', 'Coworking'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        ],
        rating: 4.8,
        ratingCount: 19,
        ratingCleanliness: 4.9,
        ratingLocation: 5.0,
        ratingCommunication: 4.8,
        ratingValue: 3.8,
        badges: ['Premium'],
        isPartner: true,
        isTopTrip: false,
        hostName: 'Laura Stone',
        hostAvatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Laura',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.place.createMany({
    data: [
      {
        id: ids.places.breka,
        name: 'Breka Bakery',
        category: 'cafes',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['24/7'],
        rating: 4.8,
        ratingCount: 330,
        address: '855 Davie St, Vancouver, BC',
        location: 'Downtown Vancouver',
        latitude: 49.2798,
        longitude: -123.1292,
        isStudentFavorite: true,
        hasDeal: true,
        dealDescription: '10% off with student ID',
        priceRange: '$$',
        description: 'Cafe popular entre estudantes para estudar ate tarde.',
        hours: {
          mon: 'Open 24 hours',
          tue: 'Open 24 hours',
          wed: 'Open 24 hours',
        },
        phone: '+1 604 555 0100',
        website: 'https://studentcompanion.dev/places/breka',
        amenities: ['Wi-Fi', 'Power outlets', 'Study friendly'],
        isActive: true,
      },
      {
        id: ids.places.stanleyPark,
        name: 'Stanley Park Seawall',
        category: 'parks',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Outdoor'],
        rating: 4.9,
        ratingCount: 510,
        address: 'Stanley Park Dr, Vancouver, BC',
        location: 'West End',
        latitude: 49.3017,
        longitude: -123.1417,
        isStudentFavorite: true,
        hasDeal: false,
        priceRange: '$',
        description: 'Lugar classico para caminhar, pedalar e descansar no fim do dia.',
        hours: {
          everyday: '06:00 - 22:00',
        },
        website: 'https://studentcompanion.dev/places/stanley-park',
        amenities: ['Biking', 'Scenic views'],
        isActive: true,
      },
      {
        id: ids.places.granville,
        name: 'Granville Entertainment District',
        category: 'nightlife',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Night Out'],
        rating: 4.2,
        ratingCount: 175,
        address: 'Granville St, Vancouver, BC',
        location: 'Downtown Vancouver',
        latitude: 49.2802,
        longitude: -123.1207,
        isStudentFavorite: false,
        hasDeal: true,
        dealDescription: 'Happy hour on Thursdays',
        priceRange: '$$$',
        description: 'Regiao com bares e casas noturnas para explorar no fim de semana.',
        hours: {
          thu: '18:00 - 02:00',
          fri: '18:00 - 03:00',
          sat: '18:00 - 03:00',
        },
        amenities: ['Group friendly'],
        isActive: true,
      },
      {
        id: ids.places.scotiabarn,
        name: 'Scotiabarn Social Pub',
        category: 'bars',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Live Games'],
        rating: 4.4,
        ratingCount: 94,
        address: '101 Beatty St, Vancouver, BC',
        location: 'Gastown',
        latitude: 49.2823,
        longitude: -123.1101,
        isStudentFavorite: true,
        hasDeal: true,
        dealDescription: 'Burger + drink combo',
        priceRange: '$$',
        description: 'Pub descontraido para assistir jogos e encontrar amigos.',
        hours: {
          mon: '16:00 - 00:00',
          fri: '15:00 - 01:00',
        },
        phone: '+1 604 555 0160',
        website: 'https://studentcompanion.dev/places/scotiabarn',
        amenities: ['Sports TV', 'Student nights'],
        isActive: true,
      },
      {
        id: ids.places.waterfrontGym,
        name: 'Waterfront Student Gym',
        category: 'sports',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Fitness'],
        rating: 4.7,
        ratingCount: 141,
        address: '200 Waterfront Rd, Vancouver, BC',
        location: 'Waterfront',
        latitude: 49.2866,
        longitude: -123.1119,
        isStudentFavorite: true,
        hasDeal: true,
        dealDescription: 'Student monthly pass',
        priceRange: '$$',
        description: 'Academia com plano estudantil e aulas coletivas.',
        hours: {
          weekdays: '06:00 - 23:00',
          weekends: '08:00 - 20:00',
        },
        phone: '+1 604 555 0188',
        website: 'https://studentcompanion.dev/places/waterfront-gym',
        amenities: ['Lockers', 'Showers', 'Classes'],
        isActive: true,
      },
      {
        id: ids.places.japadog,
        name: 'Japadog Robson',
        category: 'restaurants',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        ],
        badges: ['Quick Bite'],
        rating: 4.5,
        ratingCount: 260,
        address: '530 Robson St, Vancouver, BC',
        location: 'Downtown Vancouver',
        latitude: 49.2820,
        longitude: -123.1173,
        isStudentFavorite: true,
        hasDeal: false,
        priceRange: '$',
        description: 'Opcao rapida, barata e famosa entre estudantes internacionais.',
        hours: {
          everyday: '11:00 - 22:00',
        },
        website: 'https://studentcompanion.dev/places/japadog',
        amenities: ['Takeout'],
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.review.createMany({
    data: [
      {
        id: ids.reviews.course1,
        userId: ids.users.raphael,
        reviewableType: 'COURSE',
        reviewableId: ids.courses.generalEnglishIlsc,
        rating: 5,
        comment: 'Curso bem estruturado e com professores muito atentos ao progresso.',
      },
      {
        id: ids.reviews.course2,
        userId: ids.users.emily,
        reviewableType: 'COURSE',
        reviewableId: ids.courses.ieltsVgc,
        rating: 4,
        comment: 'Boa preparacao para IELTS, especialmente na parte de speaking.',
      },
      {
        id: ids.reviews.accommodation1,
        userId: ids.users.raphael,
        reviewableType: 'ACCOMMODATION',
        reviewableId: ids.accommodations.kitsHomestay,
        rating: 5,
        comment: 'A familia anfitria ajudou bastante na adaptacao na primeira semana.',
      },
      {
        id: ids.reviews.accommodation2,
        userId: ids.users.lucas,
        reviewableType: 'ACCOMMODATION',
        reviewableId: ids.accommodations.downtownShared,
        rating: 4,
        comment: 'Muito bem localizado e com bom ambiente para estudantes.',
      },
      {
        id: ids.reviews.place1,
        userId: ids.users.raphael,
        reviewableType: 'PLACE',
        reviewableId: ids.places.breka,
        rating: 5,
        comment: 'Melhor lugar para estudar a noite e ainda comer bem.',
      },
      {
        id: ids.reviews.place2,
        userId: ids.users.emily,
        reviewableType: 'PLACE',
        reviewableId: ids.places.waterfrontGym,
        rating: 4,
        comment: 'Plano estudante vale a pena e a estrutura e excelente.',
      },
    ],
    skipDuplicates: true,
  });

  // ── Permissions ──────────────────────────────────────────────────────────
  const permissionDefs = [
    { key: 'admin.full',        description: 'Acesso total ao sistema administrativo' },
    { key: 'users.read',        description: 'Visualizar usuários administrativos' },
    { key: 'users.write',       description: 'Criar e editar usuários administrativos' },
    { key: 'roles.read',        description: 'Visualizar perfis de acesso' },
    { key: 'roles.write',       description: 'Criar e editar perfis de acesso' },
    { key: 'permissions.read',  description: 'Visualizar permissões do sistema' },
    { key: 'structure.read',    description: 'Visualizar instituições, unidades, períodos e turmas' },
    { key: 'structure.write',   description: 'Criar e editar instituições, unidades, períodos e turmas' },
  ];

  const permMap: Record<string, string> = {};
  for (const def of permissionDefs) {
    const p = await prisma.permission.upsert({
      where: { key: def.key },
      update: { description: def.description },
      create: def,
    });
    permMap[def.key] = p.id;
  }

  // ── Admin Profiles ────────────────────────────────────────────────────────
  const profileDefs = [
    {
      name: 'super_admin',
      label: 'Super Admin',
      description: 'Acesso irrestrito ao sistema',
      isSystem: true,
      permissions: ['admin.full'],
    },
    {
      name: 'admin',
      label: 'Admin',
      description: 'Gestão de conteúdo e usuários',
      isSystem: true,
      permissions: ['users.read', 'users.write', 'roles.read', 'roles.write', 'permissions.read', 'structure.read', 'structure.write'],
    },
    {
      name: 'operador',
      label: 'Operador',
      description: 'Visualização de usuários e perfis',
      isSystem: false,
      permissions: ['users.read', 'roles.read', 'permissions.read', 'structure.read'],
    },
  ];

  const profileMap: Record<string, string> = {};
  for (const def of profileDefs) {
    const { permissions: permKeys, ...profileData } = def;
    const profile = await prisma.adminProfile.upsert({
      where: { name: profileData.name },
      update: { label: profileData.label, description: profileData.description },
      create: profileData,
    });
    profileMap[profileData.name] = profile.id;

    // Replace permissions
    await prisma.adminProfilePermission.deleteMany({ where: { profileId: profile.id } });
    await prisma.adminProfilePermission.createMany({
      data: permKeys.map((key) => ({
        profileId: profile.id,
        permissionId: permMap[key],
      })),
    });
  }

  // ── User → Profile assignments ────────────────────────────────────────────
  const userProfileAssignments = [
    { userId: ids.users.superAdmin, profileName: 'super_admin' },
    { userId: ids.users.admin,      profileName: 'admin' },
    { userId: ids.users.operador,   profileName: 'operador' },
  ];

  for (const assignment of userProfileAssignments) {
    await prisma.userAdminProfile.upsert({
      where: {
        userId_profileId: {
          userId: assignment.userId,
          profileId: profileMap[assignment.profileName],
        },
      },
      update: {},
      create: {
        userId: assignment.userId,
        profileId: profileMap[assignment.profileName],
      },
    });
  }

  console.log('Seed concluido com sucesso.');
  console.log(`Usuario principal do app: ${ids.users.raphael}`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

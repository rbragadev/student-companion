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
    raphaelCancelledOld: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    raphaelPending: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    emilyActive: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    emilyCancelled: 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    lucasDenied: 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    lucasConverted: 'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  },
  enrollments: {
    emilyActive: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    emilyCancelled: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    lucasReview: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  },
  enrollmentDocuments: {
    emilyPassport: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    emilyDiploma: 'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    lucasTranscript: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
  },
  enrollmentMessages: {
    emilyStudent: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    emilyAdmin: 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2',
    lucasAdmin: 'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3',
    emilyAccommodationAdmin: 'ddddddd4-dddd-4ddd-8ddd-ddddddddddd4',
    lucasAccommodationAdmin: 'ddddddd5-dddd-4ddd-8ddd-ddddddddddd5',
  },
  enrollmentPricing: {
    emilyActive: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    lucasReview: 'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2',
  },
  coursePricing: {
    ilscFallGeneral: 'eeeeeea1-eeee-4eee-8eee-eeeeeeeeeea1',
    ilscFallBusiness: 'eeeeeea2-eeee-4eee-8eee-eeeeeeeeeea2',
    vgcWinterIelts: 'eeeeeea3-eeee-4eee-8eee-eeeeeeeeeea3',
    cornerstoneSpringDigital: 'eeeeeea4-eeee-4eee-8eee-eeeeeeeeeea4',
  },
  accommodationPricing: {
    downtownFall: 'eeeeeeb1-eeee-4eee-8eee-eeeeeeeeeeb1',
    burnabyWinter: 'eeeeeeb2-eeee-4eee-8eee-eeeeeeeeeeb2',
    richmondSpring: 'eeeeeeb3-eeee-4eee-8eee-eeeeeeeeeeb3',
    kitsFall: 'eeeeeeb4-eeee-4eee-8eee-eeeeeeeeeeb4',
    gastownFall: 'eeeeeeb5-eeee-4eee-8eee-eeeeeeeeeeb5',
    commercialWinter: 'eeeeeeb6-eeee-4eee-8eee-eeeeeeeeeeb6',
  },
  enrollmentQuotes: {
    raphaelPendingCourseOnly: 'eeeeeec1-eeee-4eee-8eee-eeeeeeeeeec1',
    emilyIntentWithAccommodation: 'eeeeeec2-eeee-4eee-8eee-eeeeeeeeeec2',
    lucasConvertedWithAccommodation: 'eeeeeec3-eeee-4eee-8eee-eeeeeeeeeec3',
    accommodationOnlySample: 'eeeeeec4-eeee-4eee-8eee-eeeeeeeeeec4',
  },
  enrollmentQuoteItems: {
    raphaelCourse: 'eeeeeef1-eeee-4eee-8eee-eeeeeeeeeef1',
    emilyCourse: 'eeeeeef2-eeee-4eee-8eee-eeeeeeeeeef2',
    emilyAccommodation: 'eeeeeef3-eeee-4eee-8eee-eeeeeeeeeef3',
    lucasCourse: 'eeeeeef4-eeee-4eee-8eee-eeeeeeeeeef4',
    lucasAccommodation: 'eeeeeef5-eeee-4eee-8eee-eeeeeeeeeef5',
    accommodationOnly: 'eeeeeef6-eeee-4eee-8eee-eeeeeeeeeef6',
  },
  payments: {
    emilyDownPaymentPaid: '1a111111-1111-4111-8111-111111111111',
    lucasDownPaymentPending: '1a111111-1111-4111-8111-111111111112',
  },
  notifications: {
    raphaelApproved: '1b111111-1111-4111-8111-111111111111',
    raphaelPaymentConfirmed: '1b111111-1111-4111-8111-111111111112',
    lucasRejected: '1b111111-1111-4111-8111-111111111113',
    emilyDocuments: '1b111111-1111-4111-8111-111111111114',
  },
  enrollmentStatusHistory: {
    emilyStarted: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
    emilyApproved: 'fffffff2-ffff-4fff-8fff-fffffffffff2',
    emilyEnrolled: 'fffffff3-ffff-4fff-8fff-fffffffffff3',
    lucasStarted: 'fffffff4-ffff-4fff-8fff-fffffffffff4',
    lucasDocsPending: 'fffffff5-ffff-4fff-8fff-fffffffffff5',
  },
  enrollmentAccommodationStatusHistory: {
    emilySelected: 'faaaaaa1-ffff-4fff-8fff-fffffffffff1',
    emilyApproved: 'faaaaaa2-ffff-4fff-8fff-fffffffffff2',
    emilyClosed: 'faaaaaa3-ffff-4fff-8fff-fffffffffff3',
    lucasSelected: 'faaaaaa4-ffff-4fff-8fff-fffffffffff4',
  },
  commissionConfig: {
    institutionGlobal: '99999991-9999-4999-8999-999999999991',
    courseBusiness: '99999992-9999-4999-8999-999999999992',
    institutionExchange: '99999993-9999-4999-8999-999999999993',
    accommodationDowntown: '99999994-9999-4999-8999-999999999994',
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
  schoolAccommodationRecommendations: {
    ilscKits: '12111111-1111-4111-8111-111111111111',
    ilscDowntown: '12111111-1111-4111-8111-111111111112',
    ilscGastown: '12111111-1111-4111-8111-111111111113',
    vanwestBurnaby: '12111111-1111-4111-8111-111111111114',
    vanwestCommercial: '12111111-1111-4111-8111-111111111115',
    ilacRichmond: '12111111-1111-4111-8111-111111111116',
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
        studentStatus: 'pending_enrollment',
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
        studentStatus: 'pending_enrollment',
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
        period_type: 'fixed',
        auto_approve_intent: false,
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
        period_type: 'weekly',
        auto_approve_intent: true,
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
        period_type: 'weekly',
        auto_approve_intent: true,
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
        period_type: 'weekly',
        auto_approve_intent: false,
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
        period_type: 'fixed',
        auto_approve_intent: false,
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
        period_type: 'fixed',
        auto_approve_intent: false,
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

  await prisma.coursePricing.createMany({
    data: [
      {
        id: ids.coursePricing.ilscFallGeneral,
        courseId: ids.courses.generalEnglishIlsc,
        academicPeriodId: ids.academicPeriods.fall2026,
        duration: '4-24 weeks',
        basePrice: 5550,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.coursePricing.ilscFallBusiness,
        courseId: ids.courses.businessEnglishIlsc,
        academicPeriodId: ids.academicPeriods.fall2026,
        duration: '8-24 weeks',
        basePrice: 680,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.coursePricing.vgcWinterIelts,
        courseId: ids.courses.ieltsVgc,
        academicPeriodId: ids.academicPeriods.winter2027,
        duration: '12 weeks',
        basePrice: 620,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.coursePricing.cornerstoneSpringDigital,
        courseId: ids.courses.digitalMarketingCornerstone,
        academicPeriodId: ids.academicPeriods.spring2026,
        duration: '16 weeks',
        basePrice: 4350,
        currency: 'CAD',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  const enrollmentIntents = [
    {
      id: ids.enrollmentIntents.raphaelCancelledOld,
      studentId: ids.users.raphael,
      courseId: ids.courses.generalEnglishIlsc,
      classGroupId: ids.classGroups.engA1Morning,
      academicPeriodId: ids.academicPeriods.fall2026,
      accommodationId: null,
      status: 'cancelled',
      deniedReason: null,
      convertedAt: null,
      createdAt: new Date('2026-03-05T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentIntents.raphaelPending,
      studentId: ids.users.raphael,
      courseId: ids.courses.generalEnglishIlsc,
      classGroupId: ids.classGroups.engA1Morning,
      academicPeriodId: ids.academicPeriods.fall2026,
      accommodationId: null,
      status: 'pending',
      deniedReason: null,
      convertedAt: null,
      createdAt: new Date('2026-04-15T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentIntents.emilyActive,
      studentId: ids.users.emily,
      courseId: ids.courses.ieltsVgc,
      classGroupId: ids.classGroups.engB2Evening,
      academicPeriodId: ids.academicPeriods.winter2027,
      accommodationId: null,
      status: 'converted',
      deniedReason: null,
      convertedAt: new Date('2026-04-10T00:00:00.000Z'),
      createdAt: new Date('2026-04-02T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentIntents.emilyCancelled,
      studentId: ids.users.emily,
      courseId: ids.courses.generalEnglishIlsc,
      classGroupId: ids.classGroups.engA1Morning,
      academicPeriodId: ids.academicPeriods.fall2026,
      accommodationId: null,
      status: 'converted',
      deniedReason: null,
      convertedAt: new Date('2025-12-20T00:00:00.000Z'),
      createdAt: new Date('2025-12-10T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentIntents.lucasDenied,
      studentId: ids.users.lucas,
      courseId: ids.courses.digitalMarketingCornerstone,
      classGroupId: ids.classGroups.businessAfternoon,
      academicPeriodId: ids.academicPeriods.spring2026,
      accommodationId: null,
      status: 'denied',
      deniedReason: 'Documentação acadêmica incompleta para o período selecionado.',
      convertedAt: null,
      createdAt: new Date('2026-02-08T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentIntents.lucasConverted,
      studentId: ids.users.lucas,
      courseId: ids.courses.digitalMarketingCornerstone,
      classGroupId: ids.classGroups.businessAfternoon,
      academicPeriodId: ids.academicPeriods.spring2026,
      accommodationId: null,
      status: 'converted',
      deniedReason: null,
      convertedAt: new Date('2026-03-02T00:00:00.000Z'),
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
    },
  ] as const;

  for (const intent of enrollmentIntents) {
    await prisma.enrollmentIntent.upsert({
      where: { id: intent.id },
      create: intent,
      update: intent,
    });
  }

  const enrollments = [
    {
      id: ids.enrollments.emilyActive,
      studentId: ids.users.emily,
      institutionId: ids.institutions.global,
      schoolId: ids.schools.vgc,
      unitId: ids.units.burnaby,
      courseId: ids.courses.ieltsVgc,
      classGroupId: ids.classGroups.engB2Evening,
      academicPeriodId: ids.academicPeriods.winter2027,
      accommodationId: null,
      enrollmentIntentId: ids.enrollmentIntents.emilyActive,
      status: 'enrolled',
      accommodationStatus: 'closed',
      accommodationClosedAt: new Date('2026-04-13T00:00:00.000Z'),
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
    },
    {
      id: ids.enrollments.emilyCancelled,
      studentId: ids.users.emily,
      institutionId: ids.institutions.global,
      schoolId: ids.schools.ilsc,
      unitId: ids.units.downtown,
      courseId: ids.courses.generalEnglishIlsc,
      classGroupId: ids.classGroups.engA1Morning,
      academicPeriodId: ids.academicPeriods.fall2026,
      accommodationId: null,
      enrollmentIntentId: ids.enrollmentIntents.emilyCancelled,
      status: 'cancelled',
      accommodationStatus: 'not_selected',
      accommodationClosedAt: null,
      createdAt: new Date('2025-12-20T00:00:00.000Z'),
    },
    {
      id: ids.enrollments.lucasReview,
      studentId: ids.users.lucas,
      institutionId: ids.institutions.exchange,
      schoolId: ids.schools.cornerstone,
      unitId: ids.units.toronto,
      courseId: ids.courses.digitalMarketingCornerstone,
      classGroupId: ids.classGroups.businessAfternoon,
      academicPeriodId: ids.academicPeriods.spring2026,
      accommodationId: null,
      enrollmentIntentId: ids.enrollmentIntents.lucasConverted,
      status: 'documents_pending',
      accommodationStatus: 'selected',
      accommodationClosedAt: null,
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
    },
  ] as const;

  for (const enrollment of enrollments) {
    await prisma.enrollment.upsert({
      where: { id: enrollment.id },
      create: enrollment,
      update: enrollment,
    });
  }

  const statusHistory = [
    {
      id: ids.enrollmentStatusHistory.emilyStarted,
      enrollmentId: ids.enrollments.emilyActive,
      fromStatus: null,
      toStatus: 'application_started',
      reason: 'Matrícula criada a partir da intenção.',
      changedById: ids.users.admin,
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentStatusHistory.emilyApproved,
      enrollmentId: ids.enrollments.emilyActive,
      fromStatus: 'application_started',
      toStatus: 'approved',
      reason: 'Documentação revisada e aprovada.',
      changedById: ids.users.admin,
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentStatusHistory.emilyEnrolled,
      enrollmentId: ids.enrollments.emilyActive,
      fromStatus: 'approved',
      toStatus: 'enrolled',
      reason: 'Matrícula finalizada.',
      changedById: ids.users.superAdmin,
      createdAt: new Date('2026-04-14T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentStatusHistory.lucasStarted,
      enrollmentId: ids.enrollments.lucasReview,
      fromStatus: null,
      toStatus: 'application_started',
      reason: 'Matrícula iniciada após ajuste da intenção.',
      changedById: ids.users.operador,
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentStatusHistory.lucasDocsPending,
      enrollmentId: ids.enrollments.lucasReview,
      fromStatus: 'application_started',
      toStatus: 'documents_pending',
      reason: 'Aguardando histórico escolar apostilado.',
      changedById: ids.users.admin,
      createdAt: new Date('2026-03-04T00:00:00.000Z'),
    },
  ] as const;

  for (const item of statusHistory) {
    await prisma.enrollmentStatusHistory.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const accommodationStatusHistory = [
    {
      id: ids.enrollmentAccommodationStatusHistory.emilySelected,
      enrollmentId: ids.enrollments.emilyActive,
      fromStatus: 'not_selected',
      toStatus: 'selected',
      reason: 'Acomodação escolhida no pacote.',
      changedById: ids.users.admin,
      createdAt: new Date('2026-04-10T01:00:00.000Z'),
    },
    {
      id: ids.enrollmentAccommodationStatusHistory.emilyApproved,
      enrollmentId: ids.enrollments.emilyActive,
      fromStatus: 'selected',
      toStatus: 'approved',
      reason: 'Acomodação validada pela operação.',
      changedById: ids.users.admin,
      createdAt: new Date('2026-04-12T11:00:00.000Z'),
    },
    {
      id: ids.enrollmentAccommodationStatusHistory.emilyClosed,
      enrollmentId: ids.enrollments.emilyActive,
      fromStatus: 'approved',
      toStatus: 'closed',
      reason: 'Fechamento concluído para faturamento.',
      changedById: ids.users.superAdmin,
      createdAt: new Date('2026-04-13T09:00:00.000Z'),
    },
    {
      id: ids.enrollmentAccommodationStatusHistory.lucasSelected,
      enrollmentId: ids.enrollments.lucasReview,
      fromStatus: 'not_selected',
      toStatus: 'selected',
      reason: 'Acomodação vinculada ao processo.',
      changedById: ids.users.operador,
      createdAt: new Date('2026-03-03T08:00:00.000Z'),
    },
  ] as const;

  for (const item of accommodationStatusHistory) {
    await prisma.enrollmentAccommodationStatusHistory.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const documents = [
    {
      id: ids.enrollmentDocuments.emilyPassport,
      enrollmentId: ids.enrollments.emilyActive,
      type: 'passport',
      fileUrl: 'https://studentcompanion.dev/docs/emily/passport.pdf',
      status: 'approved',
      adminNote: 'Documento válido.',
      createdAt: new Date('2026-04-11T00:00:00.000Z'),
      updatedAt: new Date('2026-04-11T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentDocuments.emilyDiploma,
      enrollmentId: ids.enrollments.emilyActive,
      type: 'high_school_diploma',
      fileUrl: 'https://studentcompanion.dev/docs/emily/diploma.pdf',
      status: 'approved',
      adminNote: null,
      createdAt: new Date('2026-04-11T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentDocuments.lucasTranscript,
      enrollmentId: ids.enrollments.lucasReview,
      type: 'transcript',
      fileUrl: 'https://studentcompanion.dev/docs/lucas/transcript.pdf',
      status: 'pending',
      adminNote: 'Solicitado arquivo mais legível.',
      createdAt: new Date('2026-03-03T00:00:00.000Z'),
      updatedAt: new Date('2026-03-04T00:00:00.000Z'),
    },
  ] as const;

  for (const item of documents) {
    await prisma.enrollmentDocument.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const messages = [
    {
      id: ids.enrollmentMessages.emilyStudent,
      enrollmentId: ids.enrollments.emilyActive,
      senderId: ids.users.emily,
      channel: 'enrollment',
      message: 'Enviei os documentos solicitados. Podem validar, por favor?',
      createdAt: new Date('2026-04-11T02:00:00.000Z'),
    },
    {
      id: ids.enrollmentMessages.emilyAdmin,
      enrollmentId: ids.enrollments.emilyActive,
      senderId: ids.users.admin,
      channel: 'enrollment',
      message: 'Tudo certo, Emily. Sua matrícula foi aprovada.',
      createdAt: new Date('2026-04-12T10:30:00.000Z'),
    },
    {
      id: ids.enrollmentMessages.lucasAdmin,
      enrollmentId: ids.enrollments.lucasReview,
      senderId: ids.users.operador,
      channel: 'enrollment',
      message: 'Lucas, precisamos do histórico escolar completo para seguir.',
      createdAt: new Date('2026-03-04T09:00:00.000Z'),
    },
    {
      id: ids.enrollmentMessages.emilyAccommodationAdmin,
      enrollmentId: ids.enrollments.emilyActive,
      senderId: ids.users.admin,
      channel: 'accommodation',
      message: 'Sua acomodação foi aprovada e fechada para faturamento.',
      createdAt: new Date('2026-04-13T09:05:00.000Z'),
    },
    {
      id: ids.enrollmentMessages.lucasAccommodationAdmin,
      enrollmentId: ids.enrollments.lucasReview,
      senderId: ids.users.operador,
      channel: 'accommodation',
      message: 'Confirme os detalhes de check-in da acomodação para seguirmos.',
      createdAt: new Date('2026-03-04T12:00:00.000Z'),
    },
  ] as const;

  for (const item of messages) {
    await prisma.enrollmentMessage.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const messageReads = [
    {
      enrollmentId: ids.enrollments.emilyActive,
      userId: ids.users.emily,
      lastReadAt: new Date('2026-04-12T10:35:00.000Z'),
    },
    {
      enrollmentId: ids.enrollments.lucasReview,
      userId: ids.users.lucas,
      lastReadAt: new Date('2026-03-04T08:50:00.000Z'),
    },
  ] as const;

  for (const item of messageReads) {
    await prisma.enrollmentMessageRead.upsert({
      where: {
        enrollmentId_userId: {
          enrollmentId: item.enrollmentId,
          userId: item.userId,
        },
      },
      create: item,
      update: item,
    });
  }

  const pricing = [
    {
      id: ids.enrollmentPricing.emilyActive,
      enrollmentId: ids.enrollments.emilyActive,
      basePrice: 5400,
      fees: 450,
      discounts: 300,
      totalAmount: 6500,
      enrollmentAmount: 5550,
      accommodationAmount: 950,
      packageTotalAmount: 6500,
      currency: 'CAD',
      commissionAmount: 471.75,
      commissionPercentage: 7.2577,
      enrollmentCommissionAmount: 471.75,
      enrollmentCommissionPercentage: 8.5,
      accommodationCommissionAmount: 0,
      accommodationCommissionPercentage: 0,
      totalCommissionAmount: 471.75,
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentPricing.lucasReview,
      enrollmentId: ids.enrollments.lucasReview,
      basePrice: 4200,
      fees: 350,
      discounts: 200,
      totalAmount: 6100,
      enrollmentAmount: 4350,
      accommodationAmount: 1750,
      packageTotalAmount: 6100,
      currency: 'CAD',
      commissionAmount: 315.38,
      commissionPercentage: 5.1702,
      enrollmentCommissionAmount: 315.38,
      enrollmentCommissionPercentage: 7.25,
      accommodationCommissionAmount: 0,
      accommodationCommissionPercentage: 0,
      totalCommissionAmount: 315.38,
      createdAt: new Date('2026-03-04T00:00:00.000Z'),
      updatedAt: new Date('2026-03-04T00:00:00.000Z'),
    },
  ] as const;

  for (const item of pricing) {
    await prisma.enrollmentPricing.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const commissionConfigs = [
    {
      id: ids.commissionConfig.institutionGlobal,
      scopeType: 'institution',
      scopeId: ids.institutions.global,
      percentage: 8.5,
      fixedAmount: 0,
    },
    {
      id: ids.commissionConfig.courseBusiness,
      scopeType: 'course',
      scopeId: ids.courses.businessEnglishIlsc,
      percentage: 10,
      fixedAmount: 75,
    },
    {
      id: ids.commissionConfig.institutionExchange,
      scopeType: 'institution',
      scopeId: ids.institutions.exchange,
      percentage: 7.25,
      fixedAmount: 0,
    },
    {
      id: ids.commissionConfig.accommodationDowntown,
      scopeType: 'accommodation',
      scopeId: ids.accommodations.downtownShared,
      percentage: 5,
      fixedAmount: 40,
    },
  ] as const;

  for (const item of commissionConfigs) {
    await prisma.commissionConfig.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

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
        score: 95.2,
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
        score: 90.4,
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
        score: 86.1,
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
        score: 82.8,
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
        score: 89.7,
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
        score: 87.9,
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

  await prisma.accommodationPricing.createMany({
    data: [
      {
        id: ids.accommodationPricing.downtownFall,
        accommodationId: ids.accommodations.downtownShared,
        periodOption: 'Fall 2026',
        basePrice: 290,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.accommodationPricing.burnabyWinter,
        accommodationId: ids.accommodations.burnabyStudio,
        periodOption: 'Winter 2027',
        basePrice: 320,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.accommodationPricing.richmondSpring,
        accommodationId: ids.accommodations.richmondApartment,
        periodOption: 'Spring 2026',
        basePrice: 430,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.accommodationPricing.kitsFall,
        accommodationId: ids.accommodations.kitsHomestay,
        periodOption: 'Fall 2026',
        basePrice: 360,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.accommodationPricing.gastownFall,
        accommodationId: ids.accommodations.gastownStudio,
        periodOption: 'Fall 2026',
        basePrice: 520,
        currency: 'CAD',
        isActive: true,
      },
      {
        id: ids.accommodationPricing.commercialWinter,
        accommodationId: ids.accommodations.commercialShared,
        periodOption: 'Winter 2027',
        basePrice: 335,
        currency: 'CAD',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.enrollmentIntent.updateMany({
    where: { id: ids.enrollmentIntents.raphaelPending },
    data: { accommodationId: ids.accommodations.downtownShared },
  });
  await prisma.enrollmentIntent.updateMany({
    where: { id: ids.enrollmentIntents.emilyActive },
    data: { accommodationId: ids.accommodations.burnabyStudio },
  });
  await prisma.enrollmentIntent.updateMany({
    where: { id: ids.enrollmentIntents.lucasDenied },
    data: { accommodationId: ids.accommodations.richmondApartment },
  });
  await prisma.enrollmentIntent.updateMany({
    where: { id: ids.enrollmentIntents.lucasConverted },
    data: { accommodationId: ids.accommodations.richmondApartment },
  });

  await prisma.enrollment.updateMany({
    where: { id: ids.enrollments.emilyActive },
    data: { accommodationId: ids.accommodations.burnabyStudio },
  });
  await prisma.enrollment.updateMany({
    where: { id: ids.enrollments.lucasReview },
    data: { accommodationId: ids.accommodations.richmondApartment },
  });

  const quotes = [
    {
      id: ids.enrollmentQuotes.raphaelPendingCourseOnly,
      enrollmentIntentId: ids.enrollmentIntents.raphaelPending,
      coursePricingId: ids.coursePricing.ilscFallGeneral,
      accommodationPricingId: null,
      courseAmount: 5550,
      accommodationAmount: 0,
      fees: 150,
      discounts: 0,
      totalAmount: 5700,
      currency: 'CAD',
      downPaymentPercentage: 30,
      downPaymentAmount: 1710,
      remainingAmount: 3990,
      commissionPercentage: 8.5,
      commissionAmount: 471.75,
      commissionCourseAmount: 471.75,
      commissionAccommodationAmount: 0,
      type: 'course_only',
      createdAt: new Date('2026-04-15T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentQuotes.emilyIntentWithAccommodation,
      enrollmentIntentId: ids.enrollmentIntents.emilyActive,
      coursePricingId: ids.coursePricing.vgcWinterIelts,
      accommodationPricingId: ids.accommodationPricing.burnabyWinter,
      courseAmount: 5550,
      accommodationAmount: 950,
      fees: 450,
      discounts: 300,
      totalAmount: 6650,
      currency: 'CAD',
      downPaymentPercentage: 30,
      downPaymentAmount: 1995,
      remainingAmount: 4655,
      commissionPercentage: 7.0947,
      commissionAmount: 471.75,
      commissionCourseAmount: 471.75,
      commissionAccommodationAmount: 0,
      type: 'course_with_accommodation',
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentQuotes.lucasConvertedWithAccommodation,
      enrollmentIntentId: ids.enrollmentIntents.lucasConverted,
      coursePricingId: ids.coursePricing.cornerstoneSpringDigital,
      accommodationPricingId: ids.accommodationPricing.richmondSpring,
      courseAmount: 4350,
      accommodationAmount: 1750,
      fees: 350,
      discounts: 200,
      totalAmount: 6250,
      currency: 'CAD',
      downPaymentPercentage: 30,
      downPaymentAmount: 1875,
      remainingAmount: 4375,
      commissionPercentage: 5.0461,
      commissionAmount: 315.38,
      commissionCourseAmount: 315.38,
      commissionAccommodationAmount: 0,
      type: 'course_with_accommodation',
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
    },
    {
      id: ids.enrollmentQuotes.accommodationOnlySample,
      enrollmentIntentId: null,
      coursePricingId: null,
      accommodationPricingId: ids.accommodationPricing.kitsFall,
      courseAmount: 0,
      accommodationAmount: 1200,
      fees: 80,
      discounts: 0,
      totalAmount: 1280,
      currency: 'CAD',
      downPaymentPercentage: 30,
      downPaymentAmount: 384,
      remainingAmount: 896,
      commissionPercentage: 0,
      commissionAmount: 0,
      commissionCourseAmount: 0,
      commissionAccommodationAmount: 0,
      type: 'accommodation_only',
      createdAt: new Date('2026-04-16T00:00:00.000Z'),
    },
  ] as const;

  for (const item of quotes) {
    await prisma.enrollmentQuote.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const quoteItems = [
    {
      id: ids.enrollmentQuoteItems.raphaelCourse,
      quoteId: ids.enrollmentQuotes.raphaelPendingCourseOnly,
      itemType: 'course',
      referenceId: ids.coursePricing.ilscFallGeneral,
      coursePricingId: ids.coursePricing.ilscFallGeneral,
      accommodationPricingId: null,
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-12-20T00:00:00.000Z'),
      amount: 5550,
      commissionAmount: 471.75,
    },
    {
      id: ids.enrollmentQuoteItems.emilyCourse,
      quoteId: ids.enrollmentQuotes.emilyIntentWithAccommodation,
      itemType: 'course',
      referenceId: ids.coursePricing.vgcWinterIelts,
      coursePricingId: ids.coursePricing.vgcWinterIelts,
      accommodationPricingId: null,
      startDate: new Date('2027-01-05T00:00:00.000Z'),
      endDate: new Date('2027-03-20T00:00:00.000Z'),
      amount: 5550,
      commissionAmount: 471.75,
    },
    {
      id: ids.enrollmentQuoteItems.emilyAccommodation,
      quoteId: ids.enrollmentQuotes.emilyIntentWithAccommodation,
      itemType: 'accommodation',
      referenceId: ids.accommodationPricing.burnabyWinter,
      coursePricingId: null,
      accommodationPricingId: ids.accommodationPricing.burnabyWinter,
      startDate: new Date('2027-01-05T00:00:00.000Z'),
      endDate: new Date('2027-03-20T00:00:00.000Z'),
      amount: 950,
      commissionAmount: 0,
    },
    {
      id: ids.enrollmentQuoteItems.lucasCourse,
      quoteId: ids.enrollmentQuotes.lucasConvertedWithAccommodation,
      itemType: 'course',
      referenceId: ids.coursePricing.cornerstoneSpringDigital,
      coursePricingId: ids.coursePricing.cornerstoneSpringDigital,
      accommodationPricingId: null,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T00:00:00.000Z'),
      amount: 4350,
      commissionAmount: 315.38,
    },
    {
      id: ids.enrollmentQuoteItems.lucasAccommodation,
      quoteId: ids.enrollmentQuotes.lucasConvertedWithAccommodation,
      itemType: 'accommodation',
      referenceId: ids.accommodationPricing.richmondSpring,
      coursePricingId: null,
      accommodationPricingId: ids.accommodationPricing.richmondSpring,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T00:00:00.000Z'),
      amount: 1750,
      commissionAmount: 0,
    },
    {
      id: ids.enrollmentQuoteItems.accommodationOnly,
      quoteId: ids.enrollmentQuotes.accommodationOnlySample,
      itemType: 'accommodation',
      referenceId: ids.accommodationPricing.kitsFall,
      coursePricingId: null,
      accommodationPricingId: ids.accommodationPricing.kitsFall,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-10-27T00:00:00.000Z'),
      amount: 1200,
      commissionAmount: 0,
    },
  ] as const;

  for (const item of quoteItems) {
    await prisma.enrollmentQuoteItem.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const payments = [
    {
      id: ids.payments.emilyDownPaymentPaid,
      enrollmentId: ids.enrollments.emilyActive,
      enrollmentQuoteId: ids.enrollmentQuotes.emilyIntentWithAccommodation,
      type: 'down_payment',
      amount: 1995,
      currency: 'CAD',
      status: 'paid',
      provider: 'fake',
      providerReference: 'fake_seed_emily_001',
      paidAt: new Date('2026-04-14T11:00:00.000Z'),
      createdAt: new Date('2026-04-14T10:58:00.000Z'),
      updatedAt: new Date('2026-04-14T11:00:00.000Z'),
    },
    {
      id: ids.payments.lucasDownPaymentPending,
      enrollmentId: ids.enrollments.lucasReview,
      enrollmentQuoteId: ids.enrollmentQuotes.lucasConvertedWithAccommodation,
      type: 'down_payment',
      amount: 1875,
      currency: 'CAD',
      status: 'pending',
      provider: 'fake',
      providerReference: null,
      paidAt: null,
      createdAt: new Date('2026-03-05T09:00:00.000Z'),
      updatedAt: new Date('2026-03-05T09:00:00.000Z'),
    },
  ] as const;

  for (const item of payments) {
    await prisma.payment.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const notifications = [
    {
      id: ids.notifications.raphaelApproved,
      userId: ids.users.raphael,
      type: 'proposal_approved',
      title: 'Proposta aprovada',
      message: 'Sua proposta foi aprovada. O checkout está disponível na sua matrícula.',
      metadata: {
        enrollmentIntentId: ids.enrollmentIntents.raphaelPending,
      },
      readAt: null,
      createdAt: new Date('2026-04-16T09:00:00.000Z'),
    },
    {
      id: ids.notifications.raphaelPaymentConfirmed,
      userId: ids.users.raphael,
      type: 'payment_confirmed',
      title: 'Pagamento confirmado',
      message: 'Recebemos sua entrada. Seguiremos com as etapas operacionais.',
      metadata: {
        enrollmentIntentId: ids.enrollmentIntents.raphaelPending,
      },
      readAt: null,
      createdAt: new Date('2026-04-16T12:10:00.000Z'),
    },
    {
      id: ids.notifications.lucasRejected,
      userId: ids.users.lucas,
      type: 'proposal_rejected',
      title: 'Proposta rejeitada',
      message: 'Sua proposta foi rejeitada: documentação acadêmica incompleta para o período.',
      metadata: {
        enrollmentIntentId: ids.enrollmentIntents.lucasDenied,
      },
      readAt: null,
      createdAt: new Date('2026-02-10T09:30:00.000Z'),
    },
    {
      id: ids.notifications.emilyDocuments,
      userId: ids.users.emily,
      type: 'documents_requested',
      title: 'Documentos solicitados',
      message: 'Envie os documentos pendentes para avançarmos na matrícula.',
      metadata: {
        enrollmentId: ids.enrollments.emilyActive,
      },
      readAt: new Date('2026-04-12T09:30:00.000Z'),
      createdAt: new Date('2026-04-11T15:20:00.000Z'),
    },
  ] as const;

  for (const item of notifications) {
    await prisma.notification.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  const unreadByUser = await prisma.notification.groupBy({
    by: ['userId'],
    where: { readAt: null },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadByUser.map((row) => [row.userId, row._count._all]));
  for (const userId of [ids.users.raphael, ids.users.emily, ids.users.lucas]) {
    const count = unreadMap.get(userId) ?? 0;
    await prisma.userPreferences.update({
      where: { userId },
      data: {
        notificationCount: count,
        hasUnreadNotifications: count > 0,
      },
    });
  }

  await prisma.schoolAccommodationRecommendation.createMany({
    data: [
      {
        id: ids.schoolAccommodationRecommendations.ilscKits,
        schoolId: ids.schools.ilsc,
        accommodationId: ids.accommodations.kitsHomestay,
        isRecommended: true,
        priority: 100,
        badgeLabel: 'Recomendado pela ILSC',
      },
      {
        id: ids.schoolAccommodationRecommendations.ilscDowntown,
        schoolId: ids.schools.ilsc,
        accommodationId: ids.accommodations.downtownShared,
        isRecommended: true,
        priority: 90,
        badgeLabel: 'Perto da Escola',
      },
      {
        id: ids.schoolAccommodationRecommendations.ilscGastown,
        schoolId: ids.schools.ilsc,
        accommodationId: ids.accommodations.gastownStudio,
        isRecommended: true,
        priority: 75,
        badgeLabel: 'Opção Premium',
      },
      {
        id: ids.schoolAccommodationRecommendations.vanwestBurnaby,
        schoolId: ids.schools.vgc,
        accommodationId: ids.accommodations.burnabyStudio,
        isRecommended: true,
        priority: 95,
        badgeLabel: 'Budget para VanWest',
      },
      {
        id: ids.schoolAccommodationRecommendations.vanwestCommercial,
        schoolId: ids.schools.vgc,
        accommodationId: ids.accommodations.commercialShared,
        isRecommended: true,
        priority: 85,
        badgeLabel: 'Comunidade Estudantil',
      },
      {
        id: ids.schoolAccommodationRecommendations.ilacRichmond,
        schoolId: ids.schools.cornerstone,
        accommodationId: ids.accommodations.richmondApartment,
        isRecommended: true,
        priority: 88,
        badgeLabel: 'Escolha da ILAC',
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

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { ReviewModule } from './review/review.module';
import { SchoolModule } from './school/school.module';

@Module({
  imports: [PrismaModule, UserModule, CourseModule, ReviewModule, SchoolModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

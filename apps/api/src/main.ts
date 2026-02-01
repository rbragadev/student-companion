import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 0.0.0.0 permite conexões de qualquer interface (necessário para mobile)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

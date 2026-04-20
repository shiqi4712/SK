import { Module, OnModuleInit, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';
import { UploadModule } from './modules/upload/upload.module';
import { StatusModule } from './modules/status/status.module';
import { ScriptModule } from './modules/script/script.module';
import { ExportModule } from './modules/export/export.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { CourseKnowledgeModule } from './modules/course-knowledge/course-knowledge.module';

function getDatabaseConfig() {
  const isSqlite = process.env.DB_TYPE === 'sqlite' || process.env.DB_TYPE === 'sqljs' || !process.env.DB_TYPE;
  if (isSqlite) {
    return {
      type: 'sqlite' as const,
      database: process.env.DB_LOCATION || './data/db.sqlite',
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    };
  }
  return {
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_feedback',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    charset: 'utf8mb4',
    extra: {
      connectionLimit: 20,
    },
  };
}

function getRedisModule(): DynamicModule | null {
  if (!process.env.REDIS_HOST) return null;
  return BullModule.forRoot({
    redis: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });
}

const redisModule = getRedisModule();
const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
  ThrottlerModule.forRoot([
    {
      name: 'default',
      ttl: 60000,
      limit: 300,
    },
    {
      name: 'auth',
      ttl: 900000,
      limit: 10,
    },
  ]),
  TypeOrmModule.forRoot({
    ...getDatabaseConfig(),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
  } as any),
  AuthModule,
  UploadModule,
  StatusModule,
  ScriptModule,
  ExportModule,
  AdminModule,
  AiEngineModule,
  CourseKnowledgeModule,
];

if (redisModule) {
  imports.push(redisModule);
}

@Module({
  imports,
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private authService: AuthService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (this.dataSource.options.type === 'sqlite') {
      await this.dataSource.query('PRAGMA journal_mode = WAL;');
      await this.dataSource.query('PRAGMA busy_timeout = 10000;');
      await this.dataSource.query('PRAGMA synchronous = NORMAL;');
      console.log('SQLite WAL mode enabled for better concurrency');
    }
    await this.authService.createDefaultAdmin();
  }
}

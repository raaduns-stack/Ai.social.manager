import { Global, Module, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { seedPlans, seedSingletons, seedRolePermissions, seedPromptTemplates } from './seeding';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

// @Global means every other module can inject DATABASE_CONNECTION
// without importing DatabaseModule directly each time.
@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('database.url');
        const client = postgres(connectionString as string, { max: 10 });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      // Execute database seeding automatically on application startup
      await seedPlans(this.db);
      await seedSingletons(this.db, this.configService);
      await seedRolePermissions(this.db);
      await seedPromptTemplates(this.db);
    } catch (error) {
      // Log warning but allow app to start (e.g. if migrations haven't run yet)
      console.warn(
        'Database seeding skipped/failed (this is expected if migrations have not run yet):',
        error.message,
      );
    }
  }
}

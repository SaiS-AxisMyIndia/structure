import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppRepo } from './app.repo.js';

// Named CoreAppModule (not AppModule) to keep it distinct from the root
// composition module at src/app.module.ts, which imports this one.
@Module({
  controllers: [AppController],
  providers: [AppService, AppRepo],
})
export class CoreAppModule {}

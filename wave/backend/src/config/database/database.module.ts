import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flavour } from '../flavour/flavour.js';

// SQLite for now (see guide/ARCHITECTURE.md's "Known gaps") - a single
// file under DB_PATH (default ./data/dev.sqlite), no external server to
// run. Entity classes live alongside this module under
// config/database/entities/ - this file doesn't list them individually
// though; each feature module registers the ones it owns via
// TypeOrmModule.forFeature([...]) (see core/auth/auth.module.ts), and
// `autoLoadEntities` below picks those up for the actual DB connection.
//
// `synchronize` auto-creates/updates tables from the entities on boot -
// fine for dev/uat since there's no migration tooling yet, but never in
// prod (see config/flavour/flavour.ts) - it can silently drop/alter
// columns on a schema change, which is a dev convenience, not something a
// real deployment should ever risk.
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'data/dev.sqlite',
      autoLoadEntities: true,
      synchronize: !Flavour.isProd(),
    }),
  ],
})
export class DatabaseModule {}

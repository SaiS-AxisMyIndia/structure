import { Injectable } from '@nestjs/common';

// Data-access layer - the only place allowed to know how data is actually
// stored. No DB client is wired in yet, so this returns static data for
// now; swap the body of each method for a real query (TypeORM/Prisma/raw
// driver/etc.) once one is added, without the service or controller above
// it having to change at all.
@Injectable()
export class AppRepo {
  getGreeting(): string {
    return 'Hello World!';
  }
}

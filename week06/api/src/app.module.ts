import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TreesModule } from './trees/trees.module.js';
import { MembersModule } from './members/members.module.js';
import { PersonsModule } from './persons/persons.module.js';
import { RelationshipsModule } from './relationships/relationships.module.js';
import { MemoriesModule } from './memories/memories.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TreesModule,
    MembersModule,
    PersonsModule,
    RelationshipsModule,
    MemoriesModule,
  ],
})
export class AppModule {}

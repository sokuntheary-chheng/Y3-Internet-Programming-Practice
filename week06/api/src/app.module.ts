import { Module } from '@nestjs/common';
import { TreesModule } from './trees/trees.module.js';

@Module({
  imports: [TreesModule],
})
export class AppModule {}

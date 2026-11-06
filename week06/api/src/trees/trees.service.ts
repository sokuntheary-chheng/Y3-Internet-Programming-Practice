import { Injectable, NotFoundException } from '@nestjs/common';
import type { Tree } from './tree.entity.js';
import { CreateTreeDto } from './dto/create-tree.dto.js';
import { UpdateTreeDto } from './dto/update-tree.dto.js';

// The service holds the data and the rules. It knows nothing about HTTP
// except that it throws Nest exceptions, which become status codes.
// The data lives in memory this week; week 7 moves it to PostgreSQL.
@Injectable()
export class TreesService {
  private trees: Tree[] = [];
  private nextId = 1;

  findAll(): Tree[] {
    return [...this.trees];
  }

  findOne(id: number): Tree {
    const tree = this.trees.find((t) => t.id === id);
    if (!tree) throw new NotFoundException(`Tree ${id} not found`);
    return tree;
  }

  create(dto: CreateTreeDto): Tree {
    const tree: Tree = {
      id: this.nextId++,
      name: dto.name,
      description: dto.description ?? '',
      createdAt: new Date().toISOString(),
      // The session decides the owner; login arrives in week 8, so stand-in 1
      ownerId: 1,
    };
    this.trees.push(tree);
    return tree;
  }

  update(id: number, dto: UpdateTreeDto): Tree {
    const tree = this.findOne(id);
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) Object.assign(tree, { [key]: value });
    }
    return tree;
  }

  remove(id: number): void {
    this.findOne(id);
    this.trees = this.trees.filter((t) => t.id !== id);
  }
}

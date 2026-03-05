import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '../database/database.module.js';
import * as schema from '../database/schema/index.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';

@Injectable()
export class NotesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<typeof schema>,
  ) {}

  async create(userId: string, createNoteDto: CreateNoteDto) {
    await this.db.insert(schema.notes).values({
      userId,
      title: createNoteDto.title,
      content: createNoteDto.content ?? null,
    });

    // Fetch only the latest created note (not all user notes)
    const createdNotes = await this.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, userId))
      .orderBy(desc(schema.notes.createdAt))
      .limit(1);

    return createdNotes[0];
  }

  async findAll(userId: string, archived?: boolean) {
    const conditions = [eq(schema.notes.userId, userId)];

    if (archived !== undefined) {
      conditions.push(eq(schema.notes.isArchived, archived));
    }

    return this.db
      .select()
      .from(schema.notes)
      .where(and(...conditions))
      .orderBy(schema.notes.createdAt);
  }

  async findOne(userId: string, noteId: string) {
    const foundNotes = await this.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .limit(1);

    if (foundNotes.length === 0) {
      throw new NotFoundException('Note not found');
    }

    const note = foundNotes[0];

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return note;
  }

  async update(userId: string, noteId: string, updateNoteDto: UpdateNoteDto) {
    // Verify ownership
    await this.findOne(userId, noteId);

    const updateData: Record<string, unknown> = {};
    if (updateNoteDto.title !== undefined)
      updateData.title = updateNoteDto.title;
    if (updateNoteDto.content !== undefined)
      updateData.content = updateNoteDto.content;
    if (updateNoteDto.isArchived !== undefined)
      updateData.isArchived = updateNoteDto.isArchived;

    if (Object.keys(updateData).length === 0) {
      return this.findOne(userId, noteId);
    }

    await this.db
      .update(schema.notes)
      .set(updateData)
      .where(eq(schema.notes.id, noteId));

    return this.findOne(userId, noteId);
  }

  async remove(userId: string, noteId: string) {
    // Verify ownership
    await this.findOne(userId, noteId);

    await this.db.delete(schema.notes).where(eq(schema.notes.id, noteId));

    return { message: 'Note deleted successfully' };
  }
}

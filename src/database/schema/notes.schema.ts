/**
 * Definisi tabel notes (Drizzle schema).
 * Relasi note -> user diikat lewat foreign key user_id.
 */
import {
  mysqlTable,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from './users.schema.js';

// Struktur tabel notes + constraint relasi ke tabel users.
export const notes = mysqlTable('notes', {
  id: varchar('id', { length: 36 })
    .$defaultFn(() => uuidv4())
    .primaryKey(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    // onDelete: 'cascade' berarti saat user dihapus, notes miliknya ikut terhapus.
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Type helper otomatis dari schema notes.
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

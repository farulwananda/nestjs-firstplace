import {
  mysqlTable,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from './users.schema.js';

export const notes = mysqlTable('notes', {
  id: varchar('id', { length: 36 })
    .$defaultFn(() => uuidv4())
    .primaryKey(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

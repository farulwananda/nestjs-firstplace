import { mysqlTable, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 })
    .$defaultFn(() => uuidv4())
    .primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

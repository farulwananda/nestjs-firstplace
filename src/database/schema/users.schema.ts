/**
 * Definisi tabel users (Drizzle schema).
 * Menjadi sumber type-safe untuk operasi CRUD user.
 */
import { mysqlTable, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';

// mysqlTable(...) mendefinisikan struktur tabel users secara deklaratif.
export const users = mysqlTable('users', {
  // $defaultFn dipanggil saat insert untuk generate id otomatis.
  id: varchar('id', { length: 36 })
    .$defaultFn(() => uuidv4())
    .primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatar: varchar('avatar', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Type helper select/insert agar service dapat typing otomatis dari schema.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

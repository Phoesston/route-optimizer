import{
    pgTable, text, timestamp, boolean, integer, doublePrecision, primaryKey,
} from 'drizzle-orm/pg-core';

import type {AdapterAccountType} from "next-auth/adapters";

//Auth.js required tables
export const users = pgTable('user', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name'),
    email: text('email').unique(),
    emailVerified: timestamp('email_verified', {mode: 'date'}),
    image: text('image'),
    passwordHash: text('passwordHash'),
});

export const accounts = pgTable('account', {
    userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
}, (account) => ({
    primaryKey({columns: [account.provider, account.providerAccountId]}),
}));

export const sessions = pgTable('session', {
    sessionToken: text('sessionToken').primaryKey(),
    userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', {mode: 'date'}).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', {mode: 'date'}).notNull(),
}, (vt) => [
    primaryKey({columns: [vt.identifier, vt.token] })]);

//domain table
export const jobs = pgTable("jobs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
    address: text("address").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    serviceDuration: integer("serviceDurationMin").default(25).notNull(),
    priority: boolean("priority").default(false).notNull(),
    requiredSkills: text("requiredSkill"),
    status: text("status").default("pending").notNull(),
    sequence: integer("sequence"),
    eta: timestamp("eta", {mode: 'date'}),
    createdAt: timestamp("createdAt", {mode: 'date'}).defaultNow().notNull(),
})
import {and, eq} from "drizzle-orm";
import {db} from "@/lib/db";
import {jobs} from "@/lib/db/schema";

export async function getJobForUser(userId: string) {
    return db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(jobs.sequence);
}

export async function getPendingJobs(userId: string) {
    return db.select().from(jobs)
    .where(and(eq(jobs.userId, userId), eq(jobs.status, "pending")));
}

export async function createJob(data:{
    userId: string;
    address: string;
    longitude: number;
    latitude: number;
    serviceDurationMin?: number;
    priority?: boolean;
}) {
    const [job] =await db.insert(jobs).values(data).returning();
    return job;
}

export async function updateJobSequence(id: string, sequence: number){
    await db.update(jobs).set({sequence}).where(eq(jobs.id, id));
}

export async function setJobStatus(userId: string, id: string, status: string) {
    await db.update(jobs).set({status}).where(and(eq(jobs.id, id), eq(jobs.userId, userId)));
}
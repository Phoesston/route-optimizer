import {z} from "zod";

export const addStopSchema = z.object({
    address: z.string().min(3, "Address must be at least 3 characters long"),
});

export const statusSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "cancelled", "completed"]),
});

//Derive a TypeScript type from a Zod schema
export type AddStopInput = z.infer<typeof addStopSchema>;
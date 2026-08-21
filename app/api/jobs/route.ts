import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";
import {getJobForUser, createJob} from "@/lib/data/jobs";
import {z} from "zod";

export async function GET(){
    const session = await auth();
    if(!session?.user?.id){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const jobs = await getJobForUser(session.user.id);
    return NextResponse.json(jobs);
}

// POST /api/jobs - create a new stop for the current user
const createJobSchema = z.object({
    address: z.string().min(1),
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
    serviceDurationMin: z.number().int().positive().optional(),
    priority: z.boolean().optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if(!session?.user?.id){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if(!parsed.success){
        return NextResponse.json({error: parsed.error.issues[0].message}, {status: 400});
    }

    const job = await createJob({
        userId: session.user.id,
        ...parsed.data,
    });

    return NextResponse.json(job, {status: 201});
}
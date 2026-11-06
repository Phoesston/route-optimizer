import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";
import {getPendingJobs, updateJobSequence} from "@/lib/data/jobs";
import {optimizeRoute} from "@/lib/services/optimize";
import {z} from "zod";

const optimizeSchema = z.object({
    origin: z.object({
        longitude: z.number().min(-180).max(180),
        latitude: z.number().min(-90).max(90)
    }),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const parsed = optimizeSchema.safeParse(await req.json().catch(()=>null));

    if(!parsed.success){
        return NextResponse.json(
            {error: "A valid current location is required"},
            {status: 400}
        )
    }

    const {origin} = parsed.data;

    const pending = await getPendingJobs(session.user.id);

    console.table(
        pending.map((job,index) => ({
            index,
            id: job.id,
            address: job.address,
        }))
    );

    if (pending.length < 2) {
        return NextResponse.json({error: "At least two pending jobs are required to optimize a route."}, {status: 400});
    }

    const coords: [number, number][] = [
        [origin.longitude, origin.latitude], 
        ...pending.map(job => [job.longitude, job.latitude] as [number,number])
    ];

    console.table(coords);

    let order: number[];
    try {
        order = await optimizeRoute(coords);
    } catch (e) {
        return NextResponse.json({error: (e as Error).message}, {status: 502});
    }

    await Promise.all(
        pending.map((job, index) => updateJobSequence(job.id, order[index + 1]))
    )

    return NextResponse.json({ok: true});
}
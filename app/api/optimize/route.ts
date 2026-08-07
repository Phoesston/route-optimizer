import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";
import {getPendingJobs, updateJobSequence} from "@/lib/data/jobs";
import {optimizeRoute} from "@/lib/services/optimize";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const pending = await getPendingJobs(session.user.id);
    if (pending.length < 2) {
        return NextResponse.json({error: "At least two pending jobs are required to optimize a route."}, {status: 400});
    }

    const coords = pending.map(job => [job.longitude, job.latitude] as [number, number]);
    let order: number[];
    try {
        order = await optimizeRoute(coords);
    } catch (e) {
        return NextResponse.json({error: (e as Error).message}, {status: 502});
    }

    await Promise.all(
        pending.map((job, index) => updateJobSequence(job.id, order[index]))
    )

    return NextResponse.json({ok: true});
}
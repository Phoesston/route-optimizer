import {NextResponse} from "next/server";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {deleteJob} from "@/lib/data/jobs";

const idSchema = z.string().uuid();

export async function DELETE(req: Request,
    {params}: {params: Promise<{id: string}>}
) {
    const session = await auth();
    if(!session?.user?.id){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    
    const {id} = await params;
    const parsed = idSchema.safeParse(id);

    if(!parsed.success){
        return NextResponse.json(
            {error: "Invalid job ID"},
            {status: 400}
        );
    }
    
    try {
        const deleted = await deleteJob(session.user.id, id);
        if(!deleted){
            return NextResponse.json(
                {error: "Job not found or not owned by user"},
                {status: 404}
            );
        }

        return new NextResponse(null, {status: 204});
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json(
            {error: "Unable to delete job"},
            {status: 500}
        );
    }
}
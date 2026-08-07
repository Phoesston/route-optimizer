import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";
import {addStopSchema} from "@/lib/validation";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const body = await req.json();
    const parsed = addStopSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({error: parsed.error.issues[0].message}, {status: 400});
    }

    const url =
        `https://api.mapbox.com/search/geocode/v6/forward` +
        `?q=${encodeURIComponent(parsed.data.address)}` +
        `&limit=1&access_token=${process.env.MAPBOX_TOKEN}`;
    const data = await(await fetch(url)).json();
    const feature = data.features?.[0];

    if (!feature) {
        return NextResponse.json({error: "Address not found"}, {status: 404});
    }

    const [longitude, latitude] = feature.geometry.coordinates;
    return NextResponse.json({longitude, latitude});
}

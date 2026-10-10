import { NextResponse} from "next/server";
import {auth} from "@/lib/auth";

type MapboxFeature = {
    properties: {
        mapbox_id: string;
        full_address?: string;
        name: string;
        place_formatted?: string;
    };
};

export async function GET(request: Request){
    const session = await auth();

    if(!session?.user?.id){
        return NextResponse.json(
            {error: "Unauthorized"},
            {status: 401}
        );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";

    if(query.length < 3){
        return NextResponse.json(
            {error: "Enter at least 3 characters."},
            {status: 400}
        );
    }

    
    const token = process.env.MAPBOX_TOKEN;

    if (!token){
        return NextResponse.json(
            {error: "Address lookup is not configured."},
            {status: 500}
        );
    }

    const params = new URLSearchParams({
        q: query,
        access_token: token,
        autocomplete: "true",
        types: "address",
        limit: "5",
    });

    try{
        const response = await fetch(
            `https://api.mapbox.com/search/geocode/v6/forward?${params}`,
            {cache: "no-store"}
        );

        if (!response.ok){
            return NextResponse.json(
                {error: "Mapbox could not complete the address search."},
                {status: 502}
            );
        }

        const data: {features: MapboxFeature[]} = await response.json();

        const suggestions = data.features.map((feature) => ({
            id: feature.properties.mapbox_id,
            address:
                feature.properties.full_address ??
                [feature.properties.name, feature.properties.place_formatted]
                    .filter(Boolean)
                    .join(", "),
        }));

        return NextResponse.json(
            {suggestions },
            {headers: {"Cache-Control": "no-store"}}
        );
    } catch{
        return NextResponse.json(
            {error: "Unable to search addresses. Please retry. " },
            {status: 502}

        );
    }

     
}
type Coord = [number, number]; // [longitude, latitude]

export async function optimizeRoute(coords: Coord[]): Promise<number[]> {
    if(coords.length < 2) {
        throw new Error("At least two stops are required to optimize a route.");
    }

    const coordStr = coords.map(([lng, lat]) => `${lng},${lat}`).join(";");
    const url = 
        `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordStr}` +
        `?source=first&roundtrip=false&geometries=geojson` +
        `&access_token=${process.env.MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to optimize route: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code !== "Ok") {
        throw new Error(`Mapbox API error: ${data.message}`);
    }

    return data.waypoints.map((w:{waypoint_index: number}) => w.waypoint_index);
}
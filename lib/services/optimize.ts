type Coord = [number, number]; // [longitude, latitude]

type DurationMatrix = (number | null)[][];

export async function getDrivingTimes(
    coords: Coord[]
): Promise<DurationMatrix> {
    const token = process.env.MAPBOX_TOKEN;

    if (!token) {
        throw new Error("MAPBOX_TOKEN is missing.");
    }

    const coordStr = coords
        .map(([longitude, latitude]) => `${longitude},${latitude}`)
        .join(";");

    const url =
        `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordStr}` +
        `?annotations=duration&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {cache: "no-store"});

    if (!response.ok) {
        throw new Error(`Driving-time request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !Array.isArray(data.durations)) {
        throw new Error(data.message || "Invalid driving-time response.");
    }

    return data.durations;
}

type RouteResult = {
    duration: number;
    stops: number[];
};

export function findBestOrder(durations: DurationMatrix): number[] {
    const count = durations.length;

    // Our search supports the origin plus up to 11 jobs.
    if (count < 2 || count > 12) {
        throw new Error("Use a starting location and 1–11 stops.");
    }

    if (durations.some(row =>
        !Array.isArray(row) ||
        row.length !== count ||
        row.some(time =>
            time !== null && (!Number.isFinite(time) || time < 0)
        )
    )) {
        throw new Error("Invalid driving-time matrix.");
    }

    const cache = new Map<string, RouteResult>();

    function search(current: number, remaining: number[]): RouteResult {
        if (remaining.length === 0) {
            return {duration: 0, stops: []};
        }

        const key = `${current}|${remaining.join(",")}`;
        const cached = cache.get(key);

        if (cached) return cached;

        let best: RouteResult = {duration: Infinity, stops: []};

        for (const next of remaining) {
            const leg = durations[current][next];

            if (leg === null) continue;

            const rest = search(
                next,
                remaining.filter(index => index !== next)
            );

            const duration = leg + rest.duration;

            if (duration < best.duration) {
                best = {
                    duration,
                    stops: [next, ...rest.stops],
                };
            }
        }

        cache.set(key, best);
        return best;
    }

    const remaining = durations.map((_, index) => index).slice(1);
    const best = search(0, remaining);

    if (!Number.isFinite(best.duration)) {
        throw new Error("No drivable route through all stops.");
    }

    const positions = new Array<number>(count).fill(0);

    best.stops.forEach((stop, index) => {
        positions[stop] = index + 1;
    });

    return positions;
}

export async function optimizeRoute(coords: Coord[]): Promise<number[]> {
    if (coords.length < 2 || coords.length > 12) {
        throw new Error("Use a starting location and 1–11 stops.");
    }

    const durations = await getDrivingTimes(coords);

    return findBestOrder(durations);
}
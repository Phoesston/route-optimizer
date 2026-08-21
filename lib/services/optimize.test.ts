import {describe, it, expect, vi} from 'vitest';
import {optimizeRoute} from './optimize';

describe('optimizeRoute', () => {

    it('should throw an error if less than two stops are provided', async () => {
        await expect(optimizeRoute([[0, 0]])).rejects.toThrow("At least two stops are required to optimize a route.");
    });

    it('should throw an error if the Mapbox API returns an error', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json:async () => ({
                code: "Ok",
                waypoints: [
                    {waypoint_index: 0},
                    {waypoint_index: 2},
                    {waypoint_index: 1},
                ],
            })
        }) as unknown as typeof fetch;

        const order = await optimizeRoute([
            [0, 0],
            [1, 1],
            [2, 2]
        ]);
        expect(order).toEqual([0, 2, 1]);
    });
});
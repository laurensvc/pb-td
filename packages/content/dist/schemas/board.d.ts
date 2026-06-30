import { z } from 'zod';
export declare const waypointNodeSchema: z.ZodObject<{
    id: z.ZodString;
    grid: z.ZodObject<{
        gx: z.ZodNumber;
        gy: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        gx: number;
        gy: number;
    }, {
        gx: number;
        gy: number;
    }>;
    padSize: z.ZodNumber;
    landmarkKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    grid: {
        gx: number;
        gy: number;
    };
    padSize: number;
    landmarkKey: string;
}, {
    id: string;
    grid: {
        gx: number;
        gy: number;
    };
    padSize: number;
    landmarkKey: string;
}>;
export declare const routeLegSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
}, "strip", z.ZodTypeAny, {
    from: string;
    to: string;
}, {
    from: string;
    to: string;
}>;
export declare const boardRouteSchema: z.ZodObject<{
    id: z.ZodString;
    groundLegs: z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
    }, {
        from: string;
        to: string;
    }>, "many">;
    flyingNodes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    groundLegs: {
        from: string;
        to: string;
    }[];
    flyingNodes: string[];
}, {
    id: string;
    groundLegs: {
        from: string;
        to: string;
    }[];
    flyingNodes: string[];
}>;
export declare const boardDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    tileSize: z.ZodLiteral<32>;
    width: z.ZodNumber;
    height: z.ZodNumber;
    terrain: z.ZodObject<{
        baseTileKey: z.ZodString;
        decorKeys: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        baseTileKey: string;
        decorKeys?: string[] | undefined;
    }, {
        baseTileKey: string;
        decorKeys?: string[] | undefined;
    }>;
    landmarks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        grid: z.ZodObject<{
            gx: z.ZodNumber;
            gy: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            gx: number;
            gy: number;
        }, {
            gx: number;
            gy: number;
        }>;
        padSize: z.ZodNumber;
        landmarkKey: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        grid: {
            gx: number;
            gy: number;
        };
        padSize: number;
        landmarkKey: string;
    }, {
        id: string;
        grid: {
            gx: number;
            gy: number;
        };
        padSize: number;
        landmarkKey: string;
    }>, "many">;
    routes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        groundLegs: z.ZodArray<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            from: string;
            to: string;
        }, {
            from: string;
            to: string;
        }>, "many">;
        flyingNodes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        groundLegs: {
            from: string;
            to: string;
        }[];
        flyingNodes: string[];
    }, {
        id: string;
        groundLegs: {
            from: string;
            to: string;
        }[];
        flyingNodes: string[];
    }>, "many">;
    defaultRouteId: z.ZodString;
    zones: z.ZodObject<{
        unbuildable: z.ZodArray<z.ZodObject<{
            gx: z.ZodNumber;
            gy: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }>, "many">;
        forcedWalkable: z.ZodArray<z.ZodObject<{
            gx: z.ZodNumber;
            gy: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }>, "many">;
        goalApproachLane: z.ZodArray<z.ZodObject<{
            gx: z.ZodNumber;
            gy: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }>, "many">;
        diagonalBypass: z.ZodArray<z.ZodObject<{
            gx: z.ZodNumber;
            gy: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }, {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        unbuildable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        forcedWalkable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        goalApproachLane: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        diagonalBypass: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
    }, {
        unbuildable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        forcedWalkable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        goalApproachLane: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        diagonalBypass: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
    }>;
    camera: z.ZodObject<{
        startFocus: z.ZodString;
        bounds: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        startFocus: string;
        bounds: [number, number, number, number];
    }, {
        startFocus: string;
        bounds: [number, number, number, number];
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    displayName: string;
    tileSize: 32;
    width: number;
    height: number;
    terrain: {
        baseTileKey: string;
        decorKeys?: string[] | undefined;
    };
    landmarks: {
        id: string;
        grid: {
            gx: number;
            gy: number;
        };
        padSize: number;
        landmarkKey: string;
    }[];
    routes: {
        id: string;
        groundLegs: {
            from: string;
            to: string;
        }[];
        flyingNodes: string[];
    }[];
    defaultRouteId: string;
    zones: {
        unbuildable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        forcedWalkable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        goalApproachLane: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        diagonalBypass: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
    };
    camera: {
        startFocus: string;
        bounds: [number, number, number, number];
    };
}, {
    id: string;
    displayName: string;
    tileSize: 32;
    width: number;
    height: number;
    terrain: {
        baseTileKey: string;
        decorKeys?: string[] | undefined;
    };
    landmarks: {
        id: string;
        grid: {
            gx: number;
            gy: number;
        };
        padSize: number;
        landmarkKey: string;
    }[];
    routes: {
        id: string;
        groundLegs: {
            from: string;
            to: string;
        }[];
        flyingNodes: string[];
    }[];
    defaultRouteId: string;
    zones: {
        unbuildable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        forcedWalkable: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        goalApproachLane: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
        diagonalBypass: {
            gx: number;
            gy: number;
            w: number;
            h: number;
        }[];
    };
    camera: {
        startFocus: string;
        bounds: [number, number, number, number];
    };
}>;
export type WaypointNode = z.infer<typeof waypointNodeSchema>;
export type RouteLeg = z.infer<typeof routeLegSchema>;
export type BoardRoute = z.infer<typeof boardRouteSchema>;
export type BoardDefinition = z.infer<typeof boardDefinitionSchema>;
//# sourceMappingURL=board.d.ts.map
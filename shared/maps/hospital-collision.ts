
import {
    NodeIO,
    type Node,
} from "@gltf-transform/core";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

// ============================================================
// TYPES
// ============================================================

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface CollisionTriangle {
    a: Vec3;
    b: Vec3;
    c: Vec3;
}

export interface CollisionResult {
    position: Vec3;
    collided: boolean;
    contacts: number;
}

export interface HospitalSpawnPoint {
    name: string;
    position: Vec3;
}

// ============================================================
// VECTOR HELPERS
// ============================================================

function add(a: Vec3, b: Vec3): Vec3 {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z,
    };
}

function subtract(a: Vec3, b: Vec3): Vec3 {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z,
    };
}

function scale(v: Vec3, s: number): Vec3 {
    return {
        x: v.x * s,
        y: v.y * s,
        z: v.z * s,
    };
}

function dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function transformPoint(
    x: number,
    y: number,
    z: number,
    matrix: ArrayLike<number>,
): Vec3 {
    const w =
        matrix[3] * x +
        matrix[7] * y +
        matrix[11] * z +
        matrix[15];

    const divisor = Math.abs(w) > 1e-12 ? w : 1;

    return {
        x: (
            matrix[0] * x +
            matrix[4] * y +
            matrix[8] * z +
            matrix[12]
        ) / divisor,
        y: (
            matrix[1] * x +
            matrix[5] * y +
            matrix[9] * z +
            matrix[13]
        ) / divisor,
        z: (
            matrix[2] * x +
            matrix[6] * y +
            matrix[10] * z +
            matrix[14]
        ) / divisor,
    };
}

function triangleNormal(
    a: Vec3,
    b: Vec3,
    c: Vec3,
): Vec3 {
    const ab = subtract(b, a);
    const ac = subtract(c, a);

    return {
        x: ab.y * ac.z - ab.z * ac.y,
        y: ab.z * ac.x - ab.x * ac.z,
        z: ab.x * ac.y - ab.y * ac.x,
    };
}

// ============================================================
// CLOSEST POINT
// ============================================================

function closestPointOnSegment(
    p: Vec3,
    a: Vec3,
    b: Vec3,
): Vec3 {
    const ab = subtract(b, a);
    const denominator = dot(ab, ab);

    if (denominator <= 1e-12) {
        return a;
    }

    const t = Math.max(
        0,
        Math.min(
            1,
            dot(subtract(p, a), ab) / denominator,
        ),
    );

    return add(a, scale(ab, t));
}

function closestPointOnTriangle(
    p: Vec3,
    a: Vec3,
    b: Vec3,
    c: Vec3,
): Vec3 {
    const ab = subtract(b, a);
    const ac = subtract(c, a);
    const ap = subtract(p, a);

    const d1 = dot(ab, ap);
    const d2 = dot(ac, ap);

    if (d1 <= 0 && d2 <= 0) return a;

    const bp = subtract(p, b);
    const d3 = dot(ab, bp);
    const d4 = dot(ac, bp);

    if (d3 >= 0 && d4 <= d3) return b;

    const vc = d1 * d4 - d3 * d2;

    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
        const v = d1 / (d1 - d3);
        return add(a, scale(ab, v));
    }

    const cp = subtract(p, c);
    const d5 = dot(ab, cp);
    const d6 = dot(ac, cp);

    if (d6 >= 0 && d5 <= d6) return c;

    const vb = d5 * d2 - d1 * d6;

    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
        const w = d2 / (d2 - d6);
        return add(a, scale(ac, w));
    }

    const va = d3 * d6 - d5 * d4;

    if (
        va <= 0 &&
        d4 - d3 >= 0 &&
        d5 - d6 >= 0
    ) {
        const edge = subtract(c, b);
        const denominator =
            (d4 - d3) + (d5 - d6);

        if (Math.abs(denominator) <= 1e-12) {
            return closestPointOnSegment(p, b, c);
        }

        const w = (d4 - d3) / denominator;

        return add(b, scale(edge, w));
    }

    const denominator = va + vb + vc;

    if (Math.abs(denominator) <= 1e-12) {
        const candidates = [
            closestPointOnSegment(p, a, b),
            closestPointOnSegment(p, b, c),
            closestPointOnSegment(p, c, a),
        ];

        return candidates.reduce((best, point) => {
            const currentDistance = dot(
                subtract(p, point),
                subtract(p, point),
            );

            const bestDistance = dot(
                subtract(p, best),
                subtract(p, best),
            );

            return currentDistance < bestDistance
                ? point
                : best;
        });
    }

    const inverse = 1 / denominator;
    const v = vb * inverse;
    const w = vc * inverse;

    return add(
        a,
        add(scale(ab, v), scale(ac, w)),
    );
}

// ============================================================
// SPHERE / TRIANGLE COLLISION
// ============================================================

function resolveSphere(
    center: Vec3,
    radius: number,
    triangles: CollisionTriangle[],
): {
    center: Vec3;
    collided: boolean;
    contacts: number;
} {
    let result = { ...center };
    let collided = false;
    let contacts = 0;

    for (let iteration = 0; iteration < 4; iteration++) {
        let changed = false;

        for (const triangle of triangles) {
            const closest = closestPointOnTriangle(
                result,
                triangle.a,
                triangle.b,
                triangle.c,
            );

            const delta = subtract(result, closest);
            const distanceSquared = dot(delta, delta);

            if (distanceSquared >= radius * radius) {
                continue;
            }

            let normal: Vec3;
            let distance: number;

            if (distanceSquared > 1e-12) {
                distance = Math.sqrt(distanceSquared);
                normal = scale(delta, 1 / distance);
            } else {
                normal = triangleNormal(
                    triangle.a,
                    triangle.b,
                    triangle.c,
                );

                const length = Math.sqrt(dot(normal, normal));

                if (length <= 1e-12) continue;

                normal = scale(normal, 1 / length);
                distance = 0;
            }

            result = add(
                result,
                scale(
                    normal,
                    radius - distance + 1e-5,
                ),
            );

            collided = true;
            contacts++;
            changed = true;
        }

        if (!changed) break;
    }

    return {
        center: result,
        collided,
        contacts,
    };
}

// ============================================================
// PLAYER COLLISION
// position is the player's feet position.
// ============================================================

export function resolveHospitalPlayerCollision(
    position: Vec3,
    triangles: CollisionTriangle[],
    radius = 0.35,
    height = 1.8,
): CollisionResult {
    let feet = { ...position };
    let collided = false;
    let contacts = 0;

    const offsets = [
        radius,
        Math.max(radius, height / 2),
        Math.max(radius, height - radius),
    ];

    for (let iteration = 0; iteration < 4; iteration++) {
        let changed = false;

        for (const offset of offsets) {
            const center = {
                x: feet.x,
                y: feet.y + offset,
                z: feet.z,
            };

            const result = resolveSphere(
                center,
                radius,
                triangles,
            );

            if (!result.collided) continue;

            feet.x += result.center.x - center.x;
            feet.y += result.center.y - center.y;
            feet.z += result.center.z - center.z;

            collided = true;
            contacts += result.contacts;
            changed = true;
        }

        if (!changed) break;
    }

    return {
        position: feet,
        collided,
        contacts,
    };
}

// ============================================================
// HOSPITAL GLB COLLISION
// ============================================================

export class HospitalCollision {
    private constructor(
        private readonly triangles: CollisionTriangle[],
        private readonly spawnPoints: HospitalSpawnPoint[],
    ) {}

    static async load(): Promise<HospitalCollision> {
        const relativePath =
            "public/models/houses/hospital/hospital.glb";

        const candidates = [
            resolve(process.cwd(), relativePath),
            resolve(process.cwd(), "..", relativePath),
        ];

        const filePath = candidates.find((path) =>
            existsSync(path),
        );

        if (!filePath) {
            throw new Error(
                "[HospitalCollision] Không tìm thấy hospital.glb.\n" +
                candidates.join("\n"),
            );
        }

        const io = new NodeIO();
        const document = await io.read(filePath);
        const scenes = document.getRoot().listScenes();

        if (scenes.length === 0) {
            throw new Error(
                "[HospitalCollision] GLB không có scene.",
            );
        }

        const triangles: CollisionTriangle[] = [];
        const spawnPoints: HospitalSpawnPoint[] = [];
        const visited = new Set<Node>();

        const visitNode = (node: Node): void => {
            if (visited.has(node)) return;
            visited.add(node);

            const name = node.getName();
            const isSpawn = name.toUpperCase().startsWith("SPAWN_");
            const matrix = node.getWorldMatrix();

            if (isSpawn) {
                spawnPoints.push({
                    name,
                    position: transformPoint(
                        0,
                        0,
                        0,
                        matrix,
                    ),
                });
            }

            if (!isSpawn) {
                const mesh = node.getMesh();

                if (mesh) {
                    for (const primitive of mesh.listPrimitives()) {
                        const mode = primitive.getMode();

                        if (
                            mode !== null &&
                            mode !== 4 &&
                            mode !== 5 &&
                            mode !== 6
                        ) {
                            continue;
                        }

                        const accessor =
                            primitive.getAttribute("POSITION");

                        if (!accessor) continue;

                        const positions = accessor.getArray();

                        if (!positions) continue;

                        const vertexCount = accessor.getCount();
                        const rawIndices =
                            primitive.getIndices()?.getArray();

                        const indices: number[] = [];

                        if (rawIndices) {
                            for (
                                let i = 0;
                                i < rawIndices.length;
                                i++
                            ) {
                                indices.push(Number(rawIndices[i]));
                            }
                        } else {
                            for (let i = 0; i < vertexCount; i++) {
                                indices.push(i);
                            }
                        }

                        const getVertex = (index: number): Vec3 => {
                            const offset = index * 3;

                            return transformPoint(
                                Number(positions[offset]),
                                Number(positions[offset + 1]),
                                Number(positions[offset + 2]),
                                matrix,
                            );
                        };

                        const addTriangle = (
                            ia: number,
                            ib: number,
                            ic: number,
                        ): void => {
                            if (
                                ia < 0 ||
                                ib < 0 ||
                                ic < 0 ||
                                ia >= vertexCount ||
                                ib >= vertexCount ||
                                ic >= vertexCount
                            ) {
                                return;
                            }

                            const a = getVertex(ia);
                            const b = getVertex(ib);
                            const c = getVertex(ic);

                            const normal = triangleNormal(a, b, c);

                            if (dot(normal, normal) < 1e-12) {
                                return;
                            }

                            triangles.push({ a, b, c });
                        };

                        if (mode === 5) {
                            for (
                                let i = 0;
                                i + 2 < indices.length;
                                i++
                            ) {
                                if (i % 2 === 0) {
                                    addTriangle(
                                        indices[i],
                                        indices[i + 1],
                                        indices[i + 2],
                                    );
                                } else {
                                    addTriangle(
                                        indices[i + 1],
                                        indices[i],
                                        indices[i + 2],
                                    );
                                }
                            }
                        } else if (mode === 6) {
                            for (
                                let i = 1;
                                i + 1 < indices.length;
                                i++
                            ) {
                                addTriangle(
                                    indices[0],
                                    indices[i],
                                    indices[i + 1],
                                );
                            }
                        } else {
                            for (
                                let i = 0;
                                i + 2 < indices.length;
                                i += 3
                            ) {
                                addTriangle(
                                    indices[i],
                                    indices[i + 1],
                                    indices[i + 2],
                                );
                            }
                        }
                    }
                }
            }

            for (const child of node.listChildren()) {
                visitNode(child);
            }
        };

        for (const scene of scenes) {
    for (const node of scene.listChildren()) {
        visitNode(node);
    }
}

        if (triangles.length === 0) {
            throw new Error(
                "[HospitalCollision] Không trích xuất được tam giác từ GLB.",
            );
        }

        console.log("[HospitalCollision] GLB loaded", {
            filePath,
            triangles: triangles.length,
            spawnPoints: spawnPoints.length,
        });

        return new HospitalCollision(
            triangles,
            spawnPoints,
        );
    }

    getSpawnPoints(): HospitalSpawnPoint[] {
        return this.spawnPoints.map((spawn) => ({
            name: spawn.name,
            position: { ...spawn.position },
        }));
    }

    getTriangleCount(): number {
        return this.triangles.length;
    }

    /**
     * Tương thích với code cũ.
     * Đây là tam giác GLB, không phải collision box.
     */
    getCollisionBoxes(): CollisionTriangle[] {
        return this.triangles;
    }

    canMoveTo(
        x: number,
        z: number,
        radius = 0.35,
        y = 0,
        height = 1.8,
    ): boolean {
        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(z) ||
            !Number.isFinite(radius) ||
            !Number.isFinite(height) ||
            radius <= 0 ||
            height <= 0
        ) {
            return false;
        }

        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + height + radius;
        const minZ = z - radius;
        const maxZ = z + radius;

        // Broadphase đơn giản: chỉ lấy tam giác có AABB giao với
        // vùng thân nhân vật. Không tạo grid hay collider thủ công.
        const nearbyTriangles = this.triangles.filter((triangle) => {
            const xs = [
                triangle.a.x,
                triangle.b.x,
                triangle.c.x,
            ];
            const ys = [
                triangle.a.y,
                triangle.b.y,
                triangle.c.y,
            ];
            const zs = [
                triangle.a.z,
                triangle.b.z,
                triangle.c.z,
            ];

            return (
                Math.max(...xs) >= minX &&
                Math.min(...xs) <= maxX &&
                Math.max(...ys) >= minY &&
                Math.min(...ys) <= maxY &&
                Math.max(...zs) >= minZ &&
                Math.min(...zs) <= maxZ
            );
        });

        if (nearbyTriangles.length === 0) {
            return true;
        }

        const result = resolveHospitalPlayerCollision(
            { x, y, z },
            nearbyTriangles,
            radius,
            height,
        );

        const horizontalCorrection = Math.hypot(
            result.position.x - x,
            result.position.z - z,
        );

        return horizontalCorrection < 0.05;
    }
}

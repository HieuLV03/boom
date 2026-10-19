
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Hospital collision system.
 *
 * Không sử dụng Three.js.
 * Đọc GLB bằng @gltf-transform/core.
 *
 * Quy ước tên object:
 *   COL_WALL_...  : tường, luôn chặn
 *   COL_DOOR_...  : cửa, chặn khi đóng
 *   COL_FLOOR_... : sàn
 *   COL_STAIRS... : cầu thang
 *   SPAWN_...     : vị trí spawn
 *
 * Collision hiện tại dùng AABB (axis-aligned bounding boxes).
 * Đây là bản khởi đầu; chưa hỗ trợ mesh tam giác chính xác.
 */

import { NodeIO } from "@gltf-transform/core";
import type { Node } from "@gltf-transform/core";
export type Vec3 = {
    x: number;
    y: number;
    z: number;
};

export type CollisionKind = "wall" | "door" | "floor" | "stairs";

export type CollisionBox = {
    name: string;
    kind: CollisionKind;
    min: Vec3;
    max: Vec3;
};

export type HospitalSpawn = {
    name: string;
    position: Vec3;
};

export type HospitalCollisionOptions = {
    /**
     * Đường dẫn tới GLB.
     * Mặc định là public/models/houses/test/test.glb
     * tính từ thư mục gốc dự án Boom.
     */
    modelPath?: string;

    /**
     * Vị trí tối thiểu để phân loại vật thể là tường/cửa.
     */
    minWallHeight?: number;

    /**
     * Tên node chứa mesh sẽ được phân loại theo prefix.
     */
    includeUnnamedMeshes?: boolean;
};

type JsonNode = {
    name?: string;
    mesh?: number;
    children?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
};

type JsonPrimitive = {
    attributes?: Record<string, number>;
    indices?: number;
};

type JsonMesh = {
    name?: string;
    primitives?: JsonPrimitive[];
};

type JsonAccessor = {
    bufferView?: number;
    byteOffset?: number;
    componentType: number;
    count: number;
    type: string;
    min?: number[];
    max?: number[];
};

type JsonBufferView = {
    buffer?: number;
    byteOffset?: number;
    byteLength: number;
    byteStride?: number;
};

type JsonBuffer = {
    uri?: string;
    byteLength: number;
};

type JsonScene = {
    nodes?: number[];
};

type JsonGlb = {
    asset?: { version?: string };
    scene?: number;
    scenes?: JsonScene[];
    nodes?: JsonNode[];
    meshes?: JsonMesh[];
    accessors?: JsonAccessor[];
    bufferViews?: JsonBufferView[];
    buffers?: JsonBuffer[];
};

const EPSILON = 1e-5;

function vec3(x = 0, y = 0, z = 0): Vec3 {
    return { x, y, z };
}

function add(a: Vec3, b: Vec3): Vec3 {
    return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function multiply(a: Vec3, b: Vec3): Vec3 {
    return vec3(a.x * b.x, a.y * b.y, a.z * b.z);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function normalizeName(name: string): string {
    return name.trim().toUpperCase();
}

function classifyNode(name: string): CollisionKind | null {
    const value = normalizeName(name);

    if (
        value.startsWith("COL_WALL") ||
        value.startsWith("WALL_") ||
        value === "WALL"
    ) {
        return "wall";
    }

    if (
        value.startsWith("COL_DOOR") ||
        value.startsWith("DOOR_") ||
        value === "DOOR"
    ) {
        return "door";
    }

    if (
        value.startsWith("COL_FLOOR") ||
        value.startsWith("FLOOR_") ||
        value === "FLOOR"
    ) {
        return "floor";
    }

    if (
        value.startsWith("COL_STAIRS") ||
        value.startsWith("STAIRS_") ||
        value === "STAIRS"
    ) {
        return "stairs";
    }

    return null;
}

function transformPoint(
    point: Vec3,
    translation: Vec3,
    rotation: [number, number, number, number],
    scale: Vec3,
): Vec3 {
    let x = point.x * scale.x;
    let y = point.y * scale.y;
    let z = point.z * scale.z;

    const [qx, qy, qz, qw] = rotation;

    // Quaternion rotation.
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return add(vec3(x, y, z), translation);
}

function getAccessorBounds(
    accessorIndex: number | undefined,
    accessors: JsonAccessor[],
): { min: Vec3; max: Vec3 } | null {
    if (accessorIndex === undefined) return null;

    const accessor = accessors[accessorIndex];

    if (
        !accessor ||
        accessor.type !== "VEC3" ||
        !accessor.min ||
        !accessor.max ||
        accessor.min.length < 3 ||
        accessor.max.length < 3
    ) {
        return null;
    }

    return {
        min: vec3(
            accessor.min[0],
            accessor.min[1],
            accessor.min[2],
        ),
        max: vec3(
            accessor.max[0],
            accessor.max[1],
            accessor.max[2],
        ),
    };
}

function transformBounds(
    bounds: { min: Vec3; max: Vec3 },
    translation: Vec3,
    rotation: [number, number, number, number],
    scale: Vec3,
): { min: Vec3; max: Vec3 } {
    const corners: Vec3[] = [];

    for (const x of [bounds.min.x, bounds.max.x]) {
        for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
                corners.push(
                    transformPoint(
                        vec3(x, y, z),
                        translation,
                        rotation,
                        scale,
                    ),
                );
            }
        }
    }

    return {
        min: vec3(
            Math.min(...corners.map((p) => p.x)),
            Math.min(...corners.map((p) => p.y)),
            Math.min(...corners.map((p) => p.z)),
        ),
        max: vec3(
            Math.max(...corners.map((p) => p.x)),
            Math.max(...corners.map((p) => p.y)),
            Math.max(...corners.map((p) => p.z)),
        ),
    };
}

function intersectsXZ(
    x: number,
    z: number,
    radius: number,
    box: CollisionBox,
): boolean {
    const nearestX = clamp(x, box.min.x, box.max.x);
    const nearestZ = clamp(z, box.min.z, box.max.z);

    const dx = x - nearestX;
    const dz = z - nearestZ;

    return dx * dx + dz * dz < radius * radius;
}

export class HospitalCollision {
    private readonly boxes: CollisionBox[] = [];
    private readonly spawnPoints: HospitalSpawn[] = [];
    private readonly closedDoors = new Set<string>();

    private constructor() {}

    static async load(
        options: HospitalCollisionOptions = {},
    ): Promise<HospitalCollision> {
        const collision = new HospitalCollision();

        const modelPath =
            options.modelPath ??
            path.resolve(
                process.cwd(),
                "../public/models/houses/test/test.glb",
            );

        if (!fs.existsSync(modelPath)) {
            throw new Error(
                `[HospitalCollision] Không tìm thấy GLB: ${modelPath}`,
            );
        }

        const io = new NodeIO();
        const document = await io.read(modelPath);

        const root = document.getRoot();
        const scene = root.getDefaultScene();

        if (!scene) {
            throw new Error(
                "[HospitalCollision] GLB không có default scene.",
            );
        }

        // NodeIO đã đọc và giải mã GLB. Ta duyệt cây node glTF
        // để lấy transform và phân loại theo tên.
    
        // Phần JSON trực tiếp trong GLB có header/chunk; không thể
        // giả định JSON bắt đầu tại offset 20. Dữ liệu node thực tế
        // được duyệt qua document API bên dưới.
        collision.boxes.length = 0;
        collision.spawnPoints.length = 0;

     const visit = (
    node: Node,
    parentTranslation: Vec3,
    parentScale: Vec3,
) => {
            const name = node.getName() || "";
            const translationArray = node.getTranslation();
            const scaleArray = node.getScale();
            const rotationArray = node.getRotation();

            const localTranslation = vec3(
                translationArray[0],
                translationArray[1],
                translationArray[2],
            );

            const localScale = vec3(
                scaleArray[0],
                scaleArray[1],
                scaleArray[2],
            );

            const worldTranslation = add(
                parentTranslation,
                multiply(localTranslation, parentScale),
            );

            const worldScale = multiply(parentScale, localScale);

            const upperName = normalizeName(name);

            if (upperName.startsWith("SPAWN_")) {
                collision.spawnPoints.push({
                    name,
                    position: worldTranslation,
                });
            }

            const kind = classifyNode(name);
            const mesh = node.getMesh();

            if (kind && mesh) {
                const boundsList: Array<{ min: Vec3; max: Vec3 }> = [];

                for (const primitive of mesh.listPrimitives()) {
                    const position = primitive.getAttribute("POSITION");

                    if (!position) continue;
const min = position.getMin(new Array<number>(3));
const max = position.getMax(new Array<number>(3));

if (
    !min ||
    !max ||
    min.length < 3 ||
    max.length < 3
) {
    continue;
}

boundsList.push({
    min: vec3(min[0], min[1], min[2]),
    max: vec3(max[0], max[1], max[2]),
});
                }

                if (boundsList.length > 0) {
                    const localBounds = {
                        min: vec3(
                            Math.min(...boundsList.map((b) => b.min.x)),
                            Math.min(...boundsList.map((b) => b.min.y)),
                            Math.min(...boundsList.map((b) => b.min.z)),
                        ),
                        max: vec3(
                            Math.max(...boundsList.map((b) => b.max.x)),
                            Math.max(...boundsList.map((b) => b.max.y)),
                            Math.max(...boundsList.map((b) => b.max.z)),
                        ),
                    };

                    const bounds = transformBounds(
                        localBounds,
                        worldTranslation,
                        rotationArray as [
                            number,
                            number,
                            number,
                            number,
                        ],
                        worldScale,
                    );

                    collision.boxes.push({
                        name,
                        kind,
                        min: bounds.min,
                        max: bounds.max,
                    });
                }
            }

            for (const child of node.listChildren()) {
                visit(child, worldTranslation, worldScale);
            }
        };

        for (const node of scene.listChildren()) {
            visit(node, vec3(), vec3(1, 1, 1));
        }

        console.log(
            `[HospitalCollision] Loaded ${collision.boxes.length} collision boxes`,
        );
        console.log(
            `[HospitalCollision] Loaded ${collision.spawnPoints.length} spawn points`,
        );

        return collision;
    }

    getCollisionBoxes(): readonly CollisionBox[] {
        return this.boxes;
    }

    getSpawnPoints(): readonly HospitalSpawn[] {
        return this.spawnPoints;
    }

    setDoorOpen(doorName: string, open: boolean): void {
        if (open) {
            this.closedDoors.delete(doorName);
        } else {
            this.closedDoors.add(doorName);
        }
    }

    isDoorOpen(doorName: string): boolean {
        return !this.closedDoors.has(doorName);
    }

    canMoveTo(
        x: number,
        z: number,
        radius = 0.4,
        feetY = 0,
        height = 1.8,
    ): boolean {
        for (const box of this.boxes) {
            if (box.kind === "floor") continue;

            if (
                box.kind === "door" &&
                !this.closedDoors.has(box.name)
            ) {
                // Mặc định cửa đang mở nếu chưa đăng ký đóng.
                continue;
            }

            if (feetY + height <= box.min.y + EPSILON) continue;
            if (feetY >= box.max.y - EPSILON) continue;

            if (intersectsXZ(x, z, radius, box)) {
                return false;
            }
        }

        return true;
    }

    getFloorHeight(x: number, z: number): number | null {
        let best: number | null = null;

        for (const box of this.boxes) {
            if (box.kind !== "floor") continue;

            if (
                x < box.min.x ||
                x > box.max.x ||
                z < box.min.z ||
                z > box.max.z
            ) {
                continue;
            }

            const height = box.max.y;

            if (best === null || height > best) {
                best = height;
            }
        }

        return best;
    }

    getRandomSpawnPosition(): Vec3 {
        if (this.spawnPoints.length > 0) {
            const index = Math.floor(
                Math.random() * this.spawnPoints.length,
            );

            return { ...this.spawnPoints[index].position };
        }

        // Fallback an toàn: không tự tạo tọa độ giả trong bệnh viện.
        throw new Error(
            "[HospitalCollision] Không có node SPAWN_*. Hãy tạo SPAWN_01 trong Blender.",
        );
    }
}

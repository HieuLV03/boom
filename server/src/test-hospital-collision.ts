
import { HospitalCollision } from "./maps/hospital-collision.js";

async function main() {
    const hospital = await HospitalCollision.load();

    console.log("\n=== HOSPITAL COLLISION TEST ===");
    console.log("Số collider:", hospital.getCollisionBoxes().length);
    console.table(
        hospital.getCollisionBoxes().map((box) => ({
            name: box.name,
            kind: box.kind,
            min: JSON.stringify(box.min),
            max: JSON.stringify(box.max),
        })),
    );

    console.log("\nSpawn points:", hospital.getSpawnPoints());
    console.log("\nSpawn thử:", hospital.getRandomSpawnPosition());
}

main().catch((error) => {
    console.error("Lỗi kiểm tra hospital:", error);
    process.exitCode = 1;
});

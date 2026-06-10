/**
 * ONE-TIME SCRIPT — Upload all default GLB models to Cloudinary
 *
 * Run from backend directory:
 *   npx tsx scripts/upload-default-models.ts
 *
 * Prerequisites:
 *   1. .env file has CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   2. GLB files are in backend/public/models/
 */

import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env from backend root
const envPath = path.resolve(__dirname, "../.env");
const envResult = dotenv.config({ path: envPath });

console.log("=== Cloudinary GLB Upload Script ===\n");

// Check .env loaded
if (envResult.error) {
  console.warn("⚠️  Could not load .env from:", envPath);
  console.warn("   Trying default dotenv.config()...");
  dotenv.config();
}

// Check env vars
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

console.log("Checking environment variables...");
console.log(
  "  CLOUDINARY_CLOUD_NAME:",
  CLOUDINARY_CLOUD_NAME ? `✅ ${CLOUDINARY_CLOUD_NAME}` : "❌ MISSING",
);
console.log(
  "  CLOUDINARY_API_KEY:   ",
  CLOUDINARY_API_KEY ? "✅ set" : "❌ MISSING",
);
console.log(
  "  CLOUDINARY_API_SECRET:",
  CLOUDINARY_API_SECRET ? "✅ set" : "❌ MISSING",
);
console.log();

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error(
    "❌ Missing Cloudinary credentials. Add them to backend/.env and try again.",
  );
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// All default GLB files referenced in types.ts
const defaultModels = [
  "small_slide.glb",
  "slide_large.glb",
  "tower.glb",
  "duck.glb",
  "wave_pool.glb",
  "lazy_river.glb",
  "pump_station.glb",
  "ticket_booth.glb",
  "locker_block.glb",
  "food_kiosk.glb",
  "seating area.glb",
];

const modelsDir = path.join(__dirname, "../public/models");

console.log("Looking for GLB files in:", modelsDir);
console.log();

// Check models directory exists
if (!fs.existsSync(modelsDir)) {
  console.error("❌ Models directory not found:", modelsDir);
  console.error("   Create it and add your .glb files there.");
  process.exit(1);
}

// List what's actually in the directory
const filesInDir = fs.readdirSync(modelsDir);
console.log("Files found in models directory:");
filesInDir.forEach((f) => console.log("  -", f));
console.log();

async function uploadAll() {
  console.log("🚀 Starting upload...\n");

  const results: Record<string, string> = {};
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const filename of defaultModels) {
    const filepath = path.join(modelsDir, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`⏭️  SKIPPED (not found): ${filename}`);
      skipped.push(filename);
      continue;
    }

    const publicId = filename.replace(".glb", "").replace(/\s+/g, "_");
    console.log(
      `⬆️  Uploading: ${filename} → calibit-models/defaults/${publicId}`,
    );

    try {
      const result = await cloudinary.uploader.upload(filepath, {
        folder: "calibit-models/defaults",
        public_id: publicId,
        resource_type: "raw",
        overwrite: true,
      });

      results[filename] = result.secure_url;
      console.log(`   ✅ Done: ${result.secure_url}\n`);
    } catch (err: any) {
      console.error(`   ❌ FAILED: ${err.message}\n`);
      failed.push(filename);
    }
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Uploaded: ${Object.keys(results).length}`);
  console.log(`⏭️  Skipped:  ${skipped.length} (files not found)`);
  console.log(`❌ Failed:   ${failed.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (Object.keys(results).length > 0) {
    console.log(
      "📋 COPY THESE into types.ts (both backend AND frontend/src/types.ts):\n",
    );
    for (const [filename, url] of Object.entries(results)) {
      console.log(`  // ${filename}`);
      console.log(`  modelUrl: "${url}",`);
      console.log();
    }
  }

  if (skipped.length > 0) {
    console.log(
      "⏭️  Skipped files (add these GLBs to backend/public/models/ and re-run):",
    );
    skipped.forEach((f) => console.log(`   - ${f}`));
    console.log();
  }

  console.log("✅ Script complete.");
}

uploadAll().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});

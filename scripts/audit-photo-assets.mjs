import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const source = await readFile(path.join(root, "app", "FoodPlanner.tsx"), "utf8");
const names = [...source.matchAll(/photo\("([^"]+)"\)/g)].map((match) => match[1]);
const uniqueNames = [...new Set(names)];
const failures = [];
const recipeHashes = new Map();
const assetHashes = new Map();
const jpegDimensions = (buffer) => {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    if (!length) break;
    offset += 2 + length;
  }
  return { width: 0, height: 0 };
};

for (const name of uniqueNames) {
  const file = path.join(root, "public", "food", name + ".png");
  try {
    const info = await stat(file);
    const buffer = await readFile(file);
    const assetHash = createHash("sha256").update(buffer).digest("hex");
    const assetGroup = assetHashes.get(assetHash) || [];
    assetGroup.push(name);
    assetHashes.set(assetHash, assetGroup);
    if (name.startsWith("recipe-")) {
      const group = recipeHashes.get(assetHash) || [];
      group.push(name);
      recipeHashes.set(assetHash, group);
    }
    const pngSignature = buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    const jpegSignature = buffer[0] === 0xff && buffer[1] === 0xd8;
    const jpegSize = jpegSignature ? jpegDimensions(buffer) : { width: 0, height: 0 };
    const width = pngSignature && buffer.length >= 24 ? buffer.readUInt32BE(16) : jpegSize.width;
    const height = pngSignature && buffer.length >= 24 ? buffer.readUInt32BE(20) : jpegSize.height;
    if (!pngSignature && !jpegSignature) failures.push(name + ": formato immagine non valido");
    else if (info.size < 10_000) failures.push(name + ": file troppo piccolo (" + info.size + " byte)");
    else if (width < 200 || height < 200)
      failures.push(name + ": risoluzione insufficiente (" + width + "×" + height + ")");
  } catch {
    failures.push(name + ": file mancante");
  }
}

for (const group of recipeHashes.values()) {
  if (group.length > 1) failures.push("ricette con fotografia identica: " + group.join(", "));
}

const exactDuplicateGroups = [...assetHashes.values()].filter((group) => group.length > 1);
const reviewedSameFoodDuplicates = new Set(
  [
    ["part-papaya-v8", "part-papaya-v11"],
    ["part-almonds-v8", "part-almonds-v9"],
    ["part-zucchini-v8", "part-zucchini-v7"],
    ["part-quinoa-v7", "part-quinoa-v8"],
  ].map((group) => [...group].sort().join("|")),
);
for (const group of exactDuplicateGroups) {
  if (!reviewedSameFoodDuplicates.has([...group].sort().join("|"))) {
    failures.push("alimenti o momenti diversi con fotografia identica: " + group.join(", "));
  }
}

if (!uniqueNames.length) throw new Error("Audit fotografie: nessun asset trovato nel catalogo.");
if (failures.length) throw new Error("Fotografie non valide:\n" + failures.join("\n"));
console.log(
  "Audit fotografie: " + uniqueNames.length + "/" + uniqueNames.length + " asset presenti, leggibili e adatti alle card mobili.",
);
console.log("Duplicati binari verificati dello stesso alimento: " + exactDuplicateGroups.length + " gruppi.");
for (const group of exactDuplicateGroups) console.log("  " + group.join(" | "));

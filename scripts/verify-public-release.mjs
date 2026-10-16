import packageFile from "../package.json" with { type: "json" };

const baseUrl = process.env.VIVAPIATTO_VERIFY_URL || "https://andreacivi80.github.io/vivapiatto/";
const attempts = Number(process.env.VIVAPIATTO_VERIFY_ATTEMPTS || 36);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const request = (url, options = {}) => fetch(url, {
  cache: "no-store",
  signal: AbortSignal.timeout(15000),
  ...options,
});

let lastError = "";
let verified = false;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const nonce = `${Date.now()}-${attempt}`;
    const manifestResponse = await request(new URL(`version.json?verify=${nonce}`, baseUrl));
    if (!manifestResponse.ok) throw new Error(`manifest HTTP ${manifestResponse.status}`);
    const manifest = await manifestResponse.json();
    if (manifest.version !== packageFile.version) {
      throw new Error(`manifest ${manifest.version || "assente"}, attesa ${packageFile.version}`);
    }
    if (typeof manifest.script !== "string" || !manifest.script.includes("/assets/")) {
      throw new Error("asset della release non indicato nel manifest");
    }
    const htmlResponse = await request(new URL(`?verify=${nonce}`, baseUrl));
    if (!htmlResponse.ok) throw new Error(`pagina HTTP ${htmlResponse.status}`);
    const html = await htmlResponse.text();
    const htmlScript = html.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    if (htmlScript !== manifest.script) {
      throw new Error(`HTML ${htmlScript || "senza asset"}, manifest ${manifest.script}`);
    }
    const directResponse = await request(new URL(baseUrl));
    if (!directResponse.ok) throw new Error(`link pubblico HTTP ${directResponse.status}`);
    const directHtml = await directResponse.text();
    const directScript = directHtml.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    if (directScript !== manifest.script) {
      throw new Error(`link diretto ${directScript || "senza asset"}, manifest ${manifest.script}`);
    }
    const assetResponse = await request(new URL(manifest.script, baseUrl), { method: "HEAD" });
    if (!assetResponse.ok) throw new Error(`asset HTTP ${assetResponse.status}`);
    console.log(`Release pubblica verificata: ${manifest.version} · ${manifest.script}`);
    verified = true;
    break;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    if (attempt < attempts) await wait(5000);
  }
}

if (!verified) {
  console.error(`Release pubblica non allineata dopo ${attempts} controlli: ${lastError}`);
  process.exitCode = 1;
}

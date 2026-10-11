import { readFile, writeFile, mkdir } from 'node:fs/promises';
const covers = { ...JSON.parse(await readFile('src/data/itineraryCoverLinks.json', 'utf8')), ...JSON.parse(await readFile('src/data/day1CoverLinks.json', 'utf8')) };
await mkdir('public/covers/stable', { recursive: true });
for (const [key, cover] of Object.entries(covers)) {
  const response = await fetch(cover.image, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'OsakaTravel/2.0 (personal travel itinerary; image caching)' } });
  if (!response.ok) throw Error(`${key}: HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data[0] !== 0xff || data[1] !== 0xd8) throw Error(`${key}: not a JPEG`);
  await writeFile(`public/covers/stable/${key}.jpg`, data);
  console.log(`${key}: ${data.length} bytes`);
}

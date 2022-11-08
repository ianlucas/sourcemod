import { rmSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';
import { sourceModJson } from '../sourcemod.js';
import { fetchGithubLastReleaseWithAssets, moveSync, unzip } from '../util.js';

export async function main({ sourceModFolder, sourceMod }) {
  const latest = await fetchGithubLastReleaseWithAssets(
    'ErikMinekus',
    'sm-ripext'
  );
  if (sourceMod.ripext === latest.tagName) {
    return console.log('ripext is on latest version.');
  }
  for (const asset of latest.assets) {
    if (!asset.zipUrl.match(/windows|linux/)) {
      continue;
    }
    const response = await fetch(asset.zipUrl);
    const downloadPath = resolve(sourceModFolder, 'ripext.zip');
    const extractFolder = resolve(sourceModFolder, 'ripext');
    writeFileSync(downloadPath, Buffer.from(await response.arrayBuffer()));
    await unzip(downloadPath, extractFolder);
    const moveFolder = resolve(extractFolder, 'addons');
    const addonsFolder = resolve(sourceModFolder, 'sourcemod/addons');
    moveSync(moveFolder, addonsFolder);
    rmSync(extractFolder, { recursive: true, force: true });
    rmSync(downloadPath);
  }
  sourceMod.ripext = latest.tagName;
  sourceModJson(sourceMod);
  console.log(`ripext ${latest.tagName} downloaded.`);
}

import { readdirSync, rmSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';
import { sourceModJson } from '../sourcemod.js';
import { fetchGithubLastRelease, moveSync, unzip } from '../util.js';

export async function main({ sourceModFolder, sourceMod }) {
  const latest = await fetchGithubLastRelease('sazonische', 'modelch');
  if (sourceMod.modelch === latest.tagName) {
    return console.log('modelch is on latest version.');
  }
  const response = await fetch(latest.zipUrl);
  const downloadPath = resolve(sourceModFolder, 'modelch.zip');
  const extractFolder = resolve(sourceModFolder, 'modelch');
  writeFileSync(downloadPath, Buffer.from(await response.arrayBuffer()));
  await unzip(downloadPath, extractFolder);
  const folders = readdirSync(extractFolder);
  const moveFolder = resolve(extractFolder, folders[0], 'build/package/addons');
  const addonsFolder = resolve(sourceModFolder, 'sourcemod/addons');
  moveSync(moveFolder, addonsFolder);
  rmSync(extractFolder, { recursive: true, force: true });
  rmSync(downloadPath);
  sourceMod.modelch = latest.tagName;
  sourceModJson(sourceMod);
  console.log(`modelch ${latest.tagName} downloaded.`);
}

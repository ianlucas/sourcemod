import { readdirSync, rmSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';
import { sourceModJson } from '../sourcemod.js';
import { fetchGithubLastRelease, moveSync, unzip } from '../util.js';

export async function main({ sourceModFolder, sourceMod }) {
  const latest = await fetchGithubLastRelease('clugg', 'sm-json');
  if (sourceMod.json === latest.tagName) {
    return console.log('json is on latest version.');
  }
  const response = await fetch(latest.zipUrl);
  const downloadPath = resolve(sourceModFolder, 'json.zip');
  const extractFolder = resolve(sourceModFolder, 'json');
  writeFileSync(downloadPath, Buffer.from(await response.arrayBuffer()));
  await unzip(downloadPath, extractFolder);
  const folders = readdirSync(extractFolder);
  const moveFolder = resolve(extractFolder, folders[0], 'addons');
  const addonsFolder = resolve(sourceModFolder, 'sourcemod/addons');
  moveSync(moveFolder, addonsFolder);
  rmSync(extractFolder, { recursive: true, force: true });
  rmSync(downloadPath);
  sourceMod.json = latest.tagName;
  sourceModJson(sourceMod);
  console.log(`json ${latest.tagName} downloaded.`);
}

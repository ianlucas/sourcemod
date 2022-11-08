import { rmSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';
import { sourceModJson } from '../sourcemod.js';
import { moveSync, unzip } from '../util.js';

const provider = 'https://ptah.zizt.ru/';
const winPattern = /files\/PTaH-V([^\-]+)-build(\d+)-windows\.zip/;
const linuxPattern = /files\/PTaH-V([^\-]+)-build(\d+)-linux\.zip/;

async function downloadAndInstall(sourceModFolder, zipUrl) {
  const platform = zipUrl.indexOf('win') > -1 ? 'win' : 'linux';
  const path = resolve(sourceModFolder, `ptah-${platform}.zip`);
  const download = await fetch(provider + zipUrl);
  writeFileSync(path, Buffer.from(await download.arrayBuffer()));
  const extractFolder = resolve(sourceModFolder, `ptah-${platform}`);
  await unzip(path, extractFolder);
  const platformAddonsFolder = resolve(extractFolder, 'addons');
  const addonsFolder = resolve(sourceModFolder, 'sourcemod/addons');
  moveSync(platformAddonsFolder, addonsFolder);
  rmSync(extractFolder, { recursive: true, force: true });
  rmSync(path);
}

export async function main({ sourceModFolder, sourceMod }) {
  const response = await fetch(provider);
  const responseText = await response.text();
  const winMatches = responseText.match(winPattern);
  const linuxMatches = responseText.match(linuxPattern);
  const winZipUrl = winMatches[0];
  const linuxZipUrl = linuxMatches[0];
  let isLinuxNewerThanWindows =
    responseText.indexOf(linuxZipUrl) > responseText.indexOf(winZipUrl);
  let version = (
    isLinuxNewerThanWindows
      ? [linuxMatches[1], linuxMatches[2]]
      : [winMatches[1], winMatches[2]]
  ).join('+');
  if (sourceMod.ptah === version) {
    return console.log('ptah is on latest version.');
  }
  if (isLinuxNewerThanWindows) {
    await downloadAndInstall(sourceModFolder, winZipUrl);
    await downloadAndInstall(sourceModFolder, linuxZipUrl);
  } else {
    await downloadAndInstall(sourceModFolder, linuxZipUrl);
    await downloadAndInstall(sourceModFolder, winZipUrl);
  }
  sourceMod.ptah = version;
  sourceModJson(sourceMod);
  console.log(`ptah ${version} downloaded.`);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { rmSync, writeFileSync } from 'fs';
import got from 'got';
import { resolve } from 'path';
import { unzip } from '../fs.js';
import { SourceMod } from '../sourcemod.js';

const provider = 'https://ptah.zizt.ru/';
const winRE = /files\/PTaH-V([^\-]+)-build(\d+)-windows\.zip/;
const linuxRE = /files\/PTaH-V([^\-]+)-build(\d+)-linux\.zip/;

async function download(sourceMod: SourceMod, uri: string) {
  const url = provider + uri;
  console.log(`downloading ${url}...`);
  const response = got(url);

  const platform = uri.indexOf('windows') > -1 ? 'windows' : 'linux';
  const downloadPath = sourceMod.resolve(`ptah-${platform}.zip`);
  writeFileSync(downloadPath, await response.buffer());
  console.log('download completed.');

  const extractFolder = sourceMod.resolve(`extracted-ptah-${platform}`);
  await unzip(downloadPath, extractFolder);
  console.log('extraction completed.');

  const sourcePath = resolve(extractFolder, 'addons');
  sourceMod.copy(sourcePath, 'addons');

  rmSync(downloadPath);
}

export async function main(sourceMod: SourceMod) {
  const responseText = await got(provider).text();

  const windowsMatches = responseText.match(winRE)!;
  const linuxMatches = responseText.match(linuxRE)!;

  const windowsUrl = windowsMatches[0];
  const linuxUrl = linuxMatches[0];

  const isLinuxNewerThanWindows =
    responseText.indexOf(linuxUrl) > responseText.indexOf(windowsUrl);

  const newest = isLinuxNewerThanWindows ? linuxMatches : windowsMatches;
  const version = `${newest[1]}+${newest[2]}`;

  if (sourceMod.get('ptah') === version) {
    return console.log(`ptah is already the newest version (${version}).`);
  }

  if (isLinuxNewerThanWindows) {
    await download(sourceMod, windowsUrl);
    await download(sourceMod, linuxUrl);
  } else {
    await download(sourceMod, linuxUrl);
    await download(sourceMod, windowsUrl);
  }

  sourceMod.set('ptah', version);
  sourceMod.save();
  console.log(`installed ptah (${version}).`);
}

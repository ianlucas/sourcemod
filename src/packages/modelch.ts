/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readdirSync, rmSync, writeFileSync } from 'fs';
import got from 'got';
import { resolve } from 'path';
import { unzip } from '../fs.js';
import { Github } from '../github.js';
import { SourceMod } from '../sourcemod.js';

export async function main(sourceMod: SourceMod) {
  const release = await Github.fetchLatestRelease('sazonische', 'modelch');
  if (sourceMod.get('modelch') === release.version) {
    return console.log(
      `modelch is already the newest version (${release.version}).`
    );
  }

  console.log(`downloading ${release.url}...`);
  const response = got(release.url);

  const downloadPath = sourceMod.resolve('modelch.zip');
  writeFileSync(downloadPath, await response.buffer());
  console.log('download completed.');

  const extractFolder = sourceMod.resolve('extracted-modelch');
  await unzip(downloadPath, extractFolder);
  console.log('extraction completed.');

  const dirs = readdirSync(extractFolder);
  const sourcePath = resolve(extractFolder, dirs[0], 'build/package/addons');
  sourceMod.copy(sourcePath, 'addons');

  rmSync(downloadPath);

  sourceMod.set('modelch', release.version);
  sourceMod.save();
  console.log(`installed modelch (${release.version}).`);
}

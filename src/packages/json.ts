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
  const release = await Github.fetchLatestRelease('clugg', 'sm-json');
  if (sourceMod.get('json') === release.version) {
    return console.log(
      `json is already the newest version (${release.version}).`
    );
  }

  console.log(`downloading ${release.url}...`);
  const response = got(release.url);

  const downloadPath = sourceMod.resolve('json.zip');
  writeFileSync(downloadPath, await response.buffer());
  console.log('download completed.');

  const extractFolder = sourceMod.resolve('extracted-json');
  await unzip(downloadPath, extractFolder);
  console.log('extraction completed.');

  const dirs = readdirSync(extractFolder);
  const sourcePath = resolve(extractFolder, dirs[0], 'addons');
  sourceMod.copy(sourcePath, 'addons');

  rmSync(downloadPath);

  sourceMod.set('json', release.version);
  sourceMod.save();
  console.log(`installed json (${release.version}).`);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { rmSync, writeFileSync } from 'fs';
import got from 'got';
import { resolve } from 'path';
import { unzip } from '../fs.js';
import { Github } from '../github.js';
import { SourceMod } from '../sourcemod.js';

const platformRE = /(windows|linux)/;

export async function main(sourceMod: SourceMod) {
  const release = await Github.fetchLatestRelease('ErikMinekus', 'sm-ripext');
  if (sourceMod.get('ripext') === release.version) {
    return console.log(
      `ripext is already the newest version (${release.version}).`
    );
  }

  for (const url of release.assetUrls) {
    const matches = url.match(platformRE);
    if (!matches) {
      continue;
    }

    console.log(`downloading ${url}...`);
    const response = got(url);

    const downloadPath = sourceMod.resolve('ripext.zip');
    writeFileSync(downloadPath, await response.buffer());
    console.log('download completed.');

    const platform = matches[1];
    const extractFolder = sourceMod.resolve(`extracted-ripext-${platform}`);
    await unzip(downloadPath, extractFolder);
    console.log('extraction completed.');

    const sourcePath = resolve(extractFolder, 'addons');
    sourceMod.copy(sourcePath, 'addons');

    rmSync(downloadPath);
  }

  sourceMod.set('ripext', release.version);
  sourceMod.save();
  console.log(`installed ripext (${release.version}).`);
}

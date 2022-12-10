/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { SourceMod } from './sourcemod.js';

export async function update(platform: string) {
  if (['windows', 'linux'].indexOf(platform) === -1) {
    throw new Error('invalid platform provided.');
  }
  const sourceMod = new SourceMod(platform);
  await sourceMod.update();
}

export async function install() {
  const cwd = process.cwd();
  const sourceMod = new SourceMod();

  const dependenciesPath = resolve(cwd, 'sourcemod.txt');
  if (!existsSync(dependenciesPath)) {
    return true;
  }

  const dependencies = readFileSync(dependenciesPath, 'utf-8')
    .split('\n')
    .filter((pkg) => pkg.trim())
    .filter(Boolean);

  for (const dependency of dependencies) {
    try {
      const { main } = await import(`./packages/${dependency}.js`);
      await main(sourceMod);
    } catch (e: any) {
      if (e.message.indexOf('Cannot find package') > 1) {
        throw new Error(`there is no package available for ${dependency}`);
      }
      throw e;
    }
  }
}

export async function build(platform: string, file?: string) {
  if (['windows', 'linux'].indexOf(platform) === -1) {
    throw new Error('invalid platform provided.');
  }

  const cwd = process.cwd();
  const sourceMod = new SourceMod(platform);

  await sourceMod.build(cwd, file);
}

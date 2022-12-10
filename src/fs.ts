/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createReadStream, existsSync, rmSync } from 'fs';
import path from 'path';
import { Extract } from 'unzipper';

export function resolveAppData(...paths: string[]) {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA!, ...paths);
    case 'darwin':
      return path.join(
        process.env.HOME!,
        'Library',
        'Application Support',
        ...paths
      );
    default:
      return path.join(process.env.HOME!, ...paths);
  }
}

export function unzip(path: string, outdir: string) {
  if (existsSync(outdir)) {
    rmSync(outdir, { recursive: true, force: true });
  }
  return new Promise((resolve) => {
    createReadStream(path)
      .pipe(Extract({ path: outdir }))
      .on('close', resolve);
  });
}

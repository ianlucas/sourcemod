/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'child_process';

export function exec(
  command: string,
  input: string[]
): Promise<{ buffer: string; code: number | null }> {
  return new Promise((resolve) => {
    let buffer = '';
    const script = spawn(command, input);
    script.stdout.on('data', (data) => {
      buffer += data.toString();
    });
    script.stderr.on('data', (data) => {
      buffer += data.toString();
    });
    script.on('exit', (code) => {
      resolve({
        buffer,
        code
      });
    });
  });
}

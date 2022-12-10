#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import meow from 'meow';
import { build, install, update } from './tasks.js';

const cli = meow(
  `
  Usage:
    $ sourcemod <command>

  sourcemod update <platform>        updates or downloads the latest version of SourceMod
  sourcemod install                  install all the dependencies in your project
  sourcemod build <platform> [file]  compiles plugins from the scripting folder
  sourcemod version                  current version of the package manager
`,
  {
    importMeta: import.meta
  }
);

function main() {
  switch (cli.input[0]) {
    case 'update':
      return update(cli.input[1]);
    case 'install':
      return install();
    case 'build':
      return build(cli.input[1], cli.input[2]);
    default:
      return console.log(`Unknown command: "${cli.input[0]}"`);
  }
}

main();

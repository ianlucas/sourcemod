#!/usr/bin/env node

import meow from 'meow';
import { compile, deps, install } from './tasks.js';

const cli = meow(
  `
  Usage:
    $ sourcemod [install|compile|deps]
`,
  {
    importMeta: import.meta
  }
);

function main() {
  switch (cli.input[0]) {
    case 'install':
      return install(cli.input[1]);
    case 'deps':
      return deps();
    case 'compile':
      return compile();
    default:
      'Bad command.';
  }
}

main();

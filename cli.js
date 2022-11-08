#!/usr/bin/env node

import meow from 'meow';
import { compile, installLatestSourceModRelease } from './tasks.js';

const cli = meow(
  `
  Usage:
    $ sourcemod [latest|compile]
`,
  {
    importMeta: import.meta
  }
);

function main() {
  switch (cli.input[0]) {
    case 'latest':
      return installLatestSourceModRelease(cli.input[1]);
    case 'compile':
      return compile();
    default:
      'Bad command.';
  }
}

main();

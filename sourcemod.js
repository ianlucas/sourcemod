import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';
import { appData } from './util.js';

const filePattern = {
  windows:
    /https:\/\/sm\.alliedmods\.net\/smdrop\/([^\/]+)\/(sourcemod-[^-]+-git(\d+)-windows\.zip)/,
  linux:
    /https:\/\/sm\.alliedmods\.net\/smdrop\/([^\/]+)\/(sourcemod-[^-]+-git(\d+)-linux\.tar\.gz)/
};

export async function fetchLatestReleaseDetails(platform) {
  const pattern = filePattern[platform];
  const response = await fetch(
    'https://www.sourcemod.net/downloads.php?branch=stable'
  );
  const responseText = await response.text();
  const matches = responseText.match(pattern);
  if (!matches) {
    throw 'Unable to get latest file for this platform.';
  }
  return {
    version: matches[1],
    build: matches[3],
    url: matches[0],
    filename: matches[2]
  };
}

export function getSourceModFolder() {
  const sourceModFolder = appData('.sourcemod');
  if (!existsSync(sourceModFolder)) {
    mkdirSync(sourceModFolder);
  }
  return sourceModFolder;
}

export function sourceModJson(save) {
  const sourceModFolder = getSourceModFolder();
  const dataPath = resolve(sourceModFolder, 'sourcemod.json');
  if (!existsSync(dataPath) || save) {
    writeFileSync(
      dataPath,
      JSON.stringify(
        save || {
          sourcemod: ''
        }
      ),
      'utf-8'
    );
  }
  return JSON.parse(readFileSync(dataPath, 'utf-8'));
}

export async function resolveDependencies(cwd, sourceModFolder) {
  const dependenciesPath = resolve(cwd, 'sourcemod.txt');
  if (!existsSync(dependenciesPath)) {
    return true;
  }
  const sourceMod = sourceModJson();
  const dependencies = readFileSync(dependenciesPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((dep) => dep.trim());

  for (const dependency of dependencies) {
    try {
      const { main } = await import(`./packages/${dependency}.js`);
      await main({ sourceModFolder, sourceMod });
    } catch (e) {
      if (e.message.indexOf('Cannot find package') > -1) {
        throw `There is no package available for ${dependency}.`;
      }
      throw e;
    }
  }
}

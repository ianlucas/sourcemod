import { existsSync, readdirSync, rmSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { basename, resolve } from 'path';
import {
  fetchLatestReleaseDetails,
  getSourceModFolder,
  resolveDependencies,
  sourceModJson
} from './sourcemod.js';
import { execWin, unzip } from './util.js';

export async function install(platform) {
  const sourceModFolder = getSourceModFolder();
  const sourceMod = sourceModJson();
  const details = await fetchLatestReleaseDetails(platform);
  const version = [details.version, details.build].join('+');
  console.log(
    `Latest release: SourceMod ${details.version} (Build ${details.build}).`
  );
  if (sourceMod.sourcemod === version) {
    return console.log('No download needed. We got the latest version.');
  }
  sourceMod.sourcemod = version;
  sourceModJson(sourceMod);
  const sourceModPath = resolve(sourceModFolder, details.filename);
  const extractFolder = resolve(sourceModFolder, 'sourcemod');
  if (existsSync(extractFolder)) {
    rmSync(extractFolder, { recursive: true, force: true });
    console.log('Removed sourcemod folder for new extraction.');
  }
  const response = await fetch(details.url);
  writeFileSync(sourceModPath, Buffer.from(await response.arrayBuffer()));
  console.log('Download completed.');
  await unzip(sourceModPath, extractFolder);
  console.log('Extraction finished.');
  rmSync(sourceModPath);
}

export async function deps() {
  const smSourceModFolder = getSourceModFolder();
  const cwd = process.cwd();
  await resolveDependencies(cwd, smSourceModFolder);
}

export async function compile() {
  const smSourceModFolder = getSourceModFolder();
  /** @TODO Windows is hardcoded at the moment, so this will work only for it. */
  const smScriptingFolder = resolve(
    smSourceModFolder,
    'sourcemod/addons/sourcemod/scripting'
  );
  const compilerPath = resolve(smScriptingFolder, 'spcomp.exe');
  if (!existsSync(compilerPath)) {
    return console.error('Did you install the latest SourceMod release?');
  }
  const cwd = process.cwd();
  const sourceModFolder = resolve(cwd, 'addons/sourcemod');
  const scriptingFolder = resolve(sourceModFolder, 'scripting');
  const pluginsFolder = resolve(sourceModFolder, 'plugins');
  const includeFolder = resolve(scriptingFolder, 'include');
  const smIncludeFolder = resolve(smScriptingFolder, 'include');
  const inputFiles = readdirSync(scriptingFolder);
  for (const inputFile of inputFiles) {
    if (inputFile.indexOf('.sp') === -1) {
      continue;
    }
    const inputPath = resolve(scriptingFolder, inputFile);
    const outputFile = basename(inputFile).replace('.sp', '.smx');
    const outputPath = resolve(pluginsFolder, outputFile);
    const run = await execWin(compilerPath, [
      inputPath,
      '-o',
      outputPath,
      '-i',
      includeFolder,
      '-i',
      smIncludeFolder
    ]);
    console.log(run.buffer);
  }
}

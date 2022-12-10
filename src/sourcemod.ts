/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs';
import got from 'got';
import { basename, resolve } from 'path';
import { resolveAppData, unzip } from './fs.js';
import { exec } from './process.js';

type SourceModPackages = Record<string, string>;

const downloadRE: Record<string, RegExp> = {
  windows: /href='([^']+(sourcemod-([^-]+)-git(\d+)-windows\.zip))'/,
  linux: /href='([^']+(sourcemod-([^-]+)-git(\d+)-linux\.tar\.gz))'/
};

class SourceModDownloadsURL extends URL {
  constructor() {
    super('https://www.sourcemod.net');
    this.pathname = '/downloads.php';
    this.searchParams.set('branch', 'stable');
  }
}

export class SourceMod {
  private name: string;
  private appPath: string;
  private packagesPath: string;
  private packages: SourceModPackages;
  private platform: string;

  constructor(platform: string = 'windows') {
    this.platform = platform;
    this.name = `sourcemod-${this.platform}`;
    this.appPath = this.resolveAppPath();
    this.packagesPath = resolve(this.appPath, 'sourcemod.json');
    this.packages = this.load();
  }

  private resolveAppPath() {
    const path = resolveAppData('.sourcemod');
    if (!existsSync(path)) {
      mkdirSync(path);
    }
    return path;
  }

  private load(): SourceModPackages {
    if (!existsSync(this.packagesPath)) {
      return {};
    }
    return JSON.parse(readFileSync(this.packagesPath, 'utf-8'));
  }

  private async fetchLatestRelease() {
    const fileRE = downloadRE[this.platform];
    const url = new SourceModDownloadsURL();
    const responseText = await got(url.toString()).text();
    const matches = responseText.match(fileRE);
    if (!matches) {
      throw new Error('unable to fetch the latest release for sourcemod.');
    }
    return {
      url: matches[1],
      filename: matches[2],
      version: `${matches[3]}+${matches[4]}`
    };
  }

  set(key: string, value: string) {
    this.packages[key] = value;
  }

  get(key: string) {
    return this.packages[key];
  }

  async update() {
    const release = await this.fetchLatestRelease();
    if (this.get(this.name) === release.version) {
      console.log(
        `${this.name} is already the newest version (${release.version}).`
      );
      return false;
    }

    console.log(`downloading ${release.url}...`);
    const response = got(release.url);

    const downloadPath = resolve(this.appPath, release.filename);
    writeFileSync(downloadPath, await response.buffer());
    console.log('download completed.');

    const extractFolder = resolve(this.appPath, this.name);
    await unzip(downloadPath, extractFolder);
    rmSync(downloadPath);
    console.log('extraction completed.');

    this.set(this.name, release.version);
    this.save();
    console.log(`installed ${this.name} (${release.version}).`);
    return true;
  }

  save() {
    return writeFileSync(
      this.packagesPath,
      JSON.stringify(this.packages),
      'utf-8'
    );
  }

  resolve(...paths: string[]) {
    return resolve(
      this.appPath,
      ...paths.map((path) => {
        return path;
      })
    );
  }

  copy(source: string, paths: string, platform?: string) {
    if (platform === undefined) {
      this.copy(source, paths, 'windows');
      this.copy(source, paths, 'linux');
      return;
    }
    const pkg = `sourcemod-${platform}`;
    const target = resolve(this.appPath, pkg, paths);
    if (!existsSync(target)) {
      return;
    }
    const walk = (src: string, tgt: string) => {
      const files = readdirSync(src);
      for (const file of files) {
        const srcPath = resolve(src, file);
        const tgtPath = resolve(tgt, file);
        if (lstatSync(srcPath).isDirectory()) {
          if (!existsSync(tgtPath)) {
            mkdirSync(tgtPath);
          }
          walk(srcPath, tgtPath);
          continue;
        }
        copyFileSync(srcPath, tgtPath);
      }
    };
    return walk(source, target);
  }

  async build(cwd: string, file?: string) {
    const scriptingPath = this.resolve(this.name, 'addons/sourcemod/scripting');
    const includePath = resolve(scriptingPath, 'include');
    const compilerPath = resolve(
      scriptingPath,
      this.platform === 'windows' ? 'spcomp.exe' : 'spcomp'
    );
    if (!existsSync(compilerPath)) {
      return console.error(
        'Compiler not found. Did you install it for this platform?'
      );
    }
    const inputSMPath = resolve(cwd, 'addons/sourcemod');
    const inputScriptingPath = resolve(inputSMPath, 'scripting');
    const inputPluginsPath = resolve(inputSMPath, 'plugins');
    const inputIncludePath = resolve(inputScriptingPath, 'include');
    const inputFiles = readdirSync(inputScriptingPath);
    for (const currentFile of inputFiles) {
      if (currentFile.indexOf('.sp') === -1) {
        continue;
      }
      const filename = basename(currentFile);
      if (file !== undefined && file !== filename) {
        continue;
      }
      const inputPath = resolve(inputScriptingPath, currentFile);
      const outputFile = filename.replace('.sp', '.smx');
      const outputPath = resolve(inputPluginsPath, outputFile);
      const run = await exec(compilerPath, [
        inputPath,
        '-o',
        outputPath,
        '-i',
        includePath,
        '-i',
        inputIncludePath
      ]);
      console.log(run.buffer);
    }
  }
}

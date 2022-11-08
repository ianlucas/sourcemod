import { spawn } from 'child_process';
import {
  copyFileSync,
  createReadStream,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync
} from 'fs';
import fetch from 'node-fetch';
import path, { resolve } from 'path';
import { Extract } from 'unzipper';

export function appData(...app) {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA, ...app);
    case 'darwin':
      return path.join(
        process.env.HOME,
        'Library',
        'Application Support',
        ...app
      );
    default:
      return path.join(process.env.HOME, ...prependDot(...app));
  }
}

function prependDot(...app) {
  return app.map((item, i) => {
    if (i === 0) {
      return `.${item}`;
    }
    return item;
  });
}

export function unzip(path, outdir) {
  return new Promise((resolve) => {
    createReadStream(path)
      .pipe(Extract({ path: outdir }))
      .on('close', resolve);
  });
}

export function execWin(command, input) {
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

export async function fetchGithubLastRelease(owner, repo) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`
    );
    const releases = await response.json();
    const lastest = releases[0];
    return {
      tagName: lastest.tag_name,
      zipUrl: lastest.zipball_url
    };
  } catch {
    return {};
  }
}

export async function fetchGithubLastReleaseWithAssets(owner, repo) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`
    );
    const releases = await response.json();
    const lastest = releases[0];
    return {
      tagName: lastest.tag_name,
      assets: lastest.assets.map((asset) => ({
        zipUrl: asset.browser_download_url
      }))
    };
  } catch {
    return [];
  }
}

export function moveSync(fromFolder, toFolder) {
  function recursively(fr, to) {
    const files = readdirSync(fr);
    for (const file of files) {
      const fromPath = resolve(fr, file);
      const toPath = resolve(to, file);
      const isDirectory = lstatSync(fromPath).isDirectory();
      if (isDirectory) {
        if (!existsSync(toPath)) {
          mkdirSync(toPath);
        }
        recursively(fromPath, toPath);
        continue;
      }
      copyFileSync(fromPath, toPath);
    }
  }
  return recursively(fromFolder, toFolder);
}

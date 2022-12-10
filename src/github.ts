/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import got from 'got';

class GitHubReposReleases extends URL {
  constructor(owner: string, repo: string) {
    super('https://api.github.com');
    this.pathname = `/repos/${owner}/${repo}/releases`;
  }
}

interface GithubRelease {
  tag_name: string;
  zipball_url: string;
  assets: {
    browser_download_url: string;
  }[];
}

export class Github {
  static async fetchLatestRelease(owner: string, repo: string) {
    const url = new GitHubReposReleases(owner, repo);
    const releases = (await got(url.toString()).json()) as GithubRelease[];
    const release = releases[0];
    return {
      version: release.tag_name,
      url: release.zipball_url,
      assetUrls: release.assets.map((asset) => asset.browser_download_url)
    };
  }
}

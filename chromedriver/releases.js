'use strict';

let Fetcher = require('../_common/fetcher.js');

// See <https://googlechromelabs.github.io/chrome-for-testing/>
const releaseApiUrl =
  'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json';

// {
//   "timestamp": "2023-11-15T21:08:56.730Z",
//   "versions": [
//     {
//       "version": "121.0.6120.0",
//       "revision": "1222902",
//       "downloads": {
//         "chrome": [],
//         "chromedriver": [
//           {
//             "platform": "linux64",
//             "url": "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/121.0.6120.0/linux64/chromedriver-linux64.zip"
//           },
//           {
//             "platform": "mac-arm64",
//             "url": "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/121.0.6120.0/mac-arm64/chromedriver-mac-arm64.zip"
//           },
//           {
//             "platform": "mac-x64",
//             "url": "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/121.0.6120.0/mac-x64/chromedriver-mac-x64.zip"
//           },
//           {
//             "platform": "win32",
//             "url": "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/121.0.6120.0/win32/chromedriver-win32.zip"
//           },
//           {
//             "platform": "win64",
//             "url": "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/121.0.6120.0/win64/chromedriver-win64.zip"
//           }
//         ],
//         "chrome-headless-shell": []
//       }
//     }
//   ]
// }

module.exports = async function () {
  let resp;
  try {
    resp = await Fetcher.fetch(releaseApiUrl, {
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    /** @type {Error & { code: string, response: { status: number, body: string } }} */ //@ts-expect-error
    let err = e;
    if (err.code === 'E_FETCH_RELEASES') {
      err.message = `failed to fetch 'chromedriver' release data: ${err.response.status} ${err.response.body}`;
    }
    throw e;
  }
  let data = JSON.parse(resp.body);

  let builds = [];
  for (let release of data.versions) {
    if (!release.downloads.chromedriver) {
      continue;
    }

    let version = release.version;
    for (let asset of release.downloads.chromedriver) {
      let build = {
        version: version,
        download: asset.url,
        // I' not sure that this is actually statically built but it
        // seems to be and at worst we'll just get bug reports for Alpine
        libc: 'none',
      };

      builds.push(build);
    }
  }

  let all = {
    download: '',
    releases: builds,
  };

  return all;
};

if (module === require.main) {
  module
    .exports()
    .then(function (all) {
      all = require('../_webi/normalize.js')(all);
      // just select the latest 20 for demonstration
      all.releases = all.releases.slice(-20);
      console.info(JSON.stringify(all, null, 2));
    })
    .catch(function (err) {
      console.error('Error:', err);
    });
}

/* eslint no-redeclare: 0 */
/* global fetch:writable */
import { configRead } from './config';

const SHELF_SHORTS = 'TVHTML5_SHELF_RENDERER_TYPE_SHORTS';

const origParse = JSON.parse;
JSON.parse = function () {
  const r = origParse.apply(this, arguments);
  if (!configRead('removeShorts')) {
    return r;
  }

  // Process ALL gridRenderer occurrences (subscriptions, channels, etc.)
  findAllAndProcess(r, 'gridRenderer', (renderer) => {
    if (renderer?.items) {
      renderer.items = renderer.items.filter(
        (elm) => elm?.tileRenderer?.onSelectCommand?.reelWatchEndpoint == null
      );
    }
  });

  // Process ALL gridContinuation occurrences (pagination)
  findAllAndProcess(r, 'gridContinuation', (renderer) => {
    if (renderer?.items) {
      renderer.items = renderer.items.filter(
        (elm) => elm?.tileRenderer?.onSelectCommand?.reelWatchEndpoint == null
      );
    }
  });

  // Process ALL sectionListRenderer occurrences (home, search, music, etc.)
  findAllAndProcess(r, 'sectionListRenderer', (renderer) => {
    if (renderer?.contents) {
      // Remove entire Shorts shelves
      renderer.contents = renderer.contents.filter(
        (elm) => elm?.shelfRenderer?.tvhtml5ShelfRendererType != SHELF_SHORTS
      );

      // Remove individual Shorts from horizontal lists
      renderer.contents.forEach((content) => {
        if (content?.shelfRenderer?.content?.horizontalListRenderer?.items) {
          content.shelfRenderer.content.horizontalListRenderer.items =
            content.shelfRenderer.content.horizontalListRenderer.items.filter(
              (elm) =>
                elm?.tileRenderer?.onSelectCommand?.reelWatchEndpoint == null
            );
        }
      });
    }
  });

  // Process ALL richGridRenderer occurrences (home page)
  findAllAndProcess(r, 'richGridRenderer', (renderer) => {
    if (renderer?.contents) {
      renderer.contents = renderer.contents.filter(
        (elm) => !elm?.tileRenderer?.onSelectCommand?.reelWatchEndpoint
      );
    }
  });

  // Filter entries array (various sections)
  if (Array.isArray(r.entries)) {
    r.entries = r.entries.filter(
      (elm) => elm?.command?.reelWatchEndpoint == null
    );
  }

  return r;
};

/**
 * Find ALL objects with matching key and process them
 * @param {Object} obj - Root object to search
 * @param {string} key - Key to find
 * @param {Function} callback - Function to call on each match
 */
function findAllAndProcess(obj, key, callback) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      findAllAndProcess(item, key, callback);
    });
    return;
  }

  for (const k in obj) {
    if (k === key && obj[k]) {
      callback(obj[k]);
    }
    if (typeof obj[k] === 'object') {
      findAllAndProcess(obj[k], key, callback);
    }
  }
}

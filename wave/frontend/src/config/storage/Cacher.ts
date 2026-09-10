import { DeviceStorage } from '../device/DeviceStorage';
import { AppConstants } from '../constants/AppConstants';
import { DataResponse, isFailed, isSuccess } from '../network/data_response';

// Common cache key prefixes, so a tag string lives in exactly one place per
// feature instead of being retyped (and risking a typo/drift between two
// call sites). `key` on every method below is one flat string, composed by
// the caller (e.g. `${CacheTags.SKILL_DETAILS}/${id}` for one entry among
// many under a tag) - Cacher itself doesn't parse or split it, it's just
// the address used both as the memoryStore key and (prefixed with
// CACHE_ROOT) the on-disk file path.
export const CacheTags = {
  OCCUPATION: 'occupation',
  SKILL_DETAILS: 'skill-details',
  LANGUAGE: 'language',
};

// Shared in-memory store + in-flight-loader tracking for get() - one Map
// for the whole app so two callers asking for the same key share one
// underlying value/load instead of each keeping their own.
const memoryStore = new Map<string, unknown>();
const pendingLoads = new Map<string, Promise<unknown>>();

const CACHE_ROOT = AppConstants.storageKeys.cacheFolder;

// The extension on the last path segment of `key` - 'json' for
// 'tag/42.json', 'png' for 'images/avatar.png', '' for 'tag/42' (no
// extension at all). Deliberately anchored so a dot in an earlier segment
// (e.g. 'v1.2/item') never counts - only a dot in the *final* segment,
// with nothing but the extension itself after it, is one.
function extensionOf(key: string): string {
  const match = /\.([^./]+)$/.exec(key);
  return match ? match[1].toLowerCase() : '';
}

// deviceSave/deviceUpdate/deviceGet/deviceHas/deviceClear all resolve
// through this first - `key` with no extension of its own defaults to
// `.json` (e.g. 'skill-details/42' is actually stored as
// 'skill-details/42.json'); a key that already names one (`.png`, `.jpg`,
// ...) is used exactly as given, since that's the caller's own explicit
// choice of format - see isJsonKey below for what that choice then does
// to how the content itself gets written/read.
function withExtension(key: string): string {
  return extensionOf(key) ? key : `${key}.json`;
}

// Whether `key` (already run through withExtension) should be treated as
// JSON - true for '.json' (including the default above), false for
// anything else. A non-JSON key's value is treated as a base64-encoded
// string and written/read with DeviceStorage's own `{ encoding: 'base64'
// }` (see its own FileOptions comment) rather than JSON.stringify/parse'd
// or written as plain 'utf8' text - e.g. an image saved as base64:
// `Cacher.deviceSave('images/avatar.png', DataResponse.success(
// base64String))` decodes that string into real binary bytes on disk (a
// file Preview/an OS image decoder can actually open), not the literal
// base64 *characters* - and deviceGet's loader for the same key would
// resolve `DataResponse.success(base64String)` the same way, re-encoded
// back to base64 on read.
function isJsonKey(key: string): boolean {
  return extensionOf(key) === 'json';
}

function deviceFile(key: string): string {
  return `${CACHE_ROOT}/${key}`;
}

// The folder that must exist before writing deviceFile(key) - everything
// up to `key`'s last '/', since RNFS.writeFile doesn't create intermediate
// directories itself. A flat `key` (no '/') just needs CACHE_ROOT itself.
function folderFor(key: string): string {
  const parent = key.split('/').slice(0, -1).join('/');
  return parent ? `${CACHE_ROOT}/${parent}` : CACHE_ROOT;
}

// Safe to call unconditionally before every device* write - createFolder
// (RNFS.mkdir) is a no-op, not a failure, for a folder that already
// exists.
function ensureFolder(key: string): Promise<DataResponse<string>> {
  return DeviceStorage.createFolder(folderFor(key));
}

export const Cacher = {
  // "Load once, else return what's already loaded" - the first get() for
  // a `key` runs `loader()` and caches its resolved value in RAM; every
  // call after that (this session only) returns the cached value without
  // calling `loader` again. Concurrent calls for the same not-yet-loaded
  // key share one in-flight `loader()` call.
  //
  // `loader` returns a DataResponse (same shape SecureCall's own calls
  // already resolve to) rather than a plain value - only a *successful*
  // one gets cached, a failed one is never stored, so the next call
  // retries `loader()` from scratch instead of caching the failure as if
  // it were good data. Always resolves (never rejects) - a `loader` that
  // itself throws is caught and turned into a failed DataResponse too,
  // same as everything else in Cacher/DeviceStorage.
  get: async <T>(key: string, loader: () => Promise<DataResponse<T>>): Promise<DataResponse<T>> => {
    if (memoryStore.has(key)) {
      return DataResponse.success(memoryStore.get(key) as T);
    }
    if (!pendingLoads.has(key)) {
      pendingLoads.set(
        key,
        loader()
          .catch(err => DataResponse.failed(err instanceof Error ? err.message : 'Cacher loader failed.'))
          .then(response => {
            if (isSuccess(response)) {
              memoryStore.set(key, response.data);
            }
            pendingLoads.delete(key);
            return response;
          }),
      );
    }
    return pendingLoads.get(key) as Promise<DataResponse<T>>;
  },

  // Same "load once, cache on success only" contract as get(), persisted
  // through DeviceStorage instead of RAM - survives an app restart, gone
  // only if the app is uninstalled. `key` gets `.json` appended if it has
  // no extension of its own (see withExtension) - and its content is
  // read/written as JSON only in that case; a key with a non-JSON
  // extension (e.g. an image saved as `.png`) is read/written as a raw
  // string instead (see isJsonKey).
  deviceGet: async <T>(key: string, loader: () => Promise<DataResponse<T>>): Promise<DataResponse<T>> => {
    const path = withExtension(key);
    const jsonMode = isJsonKey(path);
    const existing = jsonMode
      ? await DeviceStorage.readJSON<T>(deviceFile(path))
      : ((await DeviceStorage.readFile(deviceFile(path), { encoding: 'base64' })) as unknown as DataResponse<T>);
    if (isSuccess(existing)) {
      return existing;
    }

    let response: DataResponse<T>;
    try {
      response = await loader();
    } catch (err) {
      return DataResponse.failed(err instanceof Error ? err.message : 'Cacher loader failed.');
    }

    if (isSuccess(response)) {
      await ensureFolder(path);
      const content = jsonMode ? JSON.stringify(response.data) : (response.data as unknown as string);
      await DeviceStorage.updateFile(deviceFile(path), content, jsonMode ? undefined : { encoding: 'base64' });
    }
    return response;
  },

  // Whether `key` is currently cached in memory - the natural "would
  // get() return a cached value right now, or actually call loader()"
  // check, without triggering a load.
  has: (key: string): boolean => memoryStore.has(key),

  // Device equivalent of has() - whether `key` exists on disk (same
  // `.json`-default extension resolution as deviceGet/deviceSave).
  // Delegates to DeviceStorage.exists, so (per its own comment) this only
  // *fails* if the check itself couldn't run (web, a native error) -
  // "doesn't exist" is a normal successful `false` result, not a failure.
  deviceHas: (key: string): Promise<DataResponse<boolean>> => DeviceStorage.exists(deviceFile(withExtension(key))),

  // Directly stores `value` in memory, right now, no loader - `value` is a
  // DataResponse (same shape get()'s own loader resolves to, and every
  // other method here already deals in - see its own comment), not a
  // plain value: a failed `value` is returned straight back out, nothing
  // is stored, same "never cache a failure" contract get() uses. Fails
  // (a *different* failure) if `key` is already cached - use update() to
  // overwrite on purpose (same create-vs-update split as
  // DeviceStorage.createFile/updateFile).
  save: <T>(key: string, value: DataResponse<T>): DataResponse<T> => {
    if (isFailed(value)) {return value;}
    if (memoryStore.has(key)) {
      return DataResponse.failed(`${key} already exists in memory cache - use update to overwrite it.`);
    }
    memoryStore.set(key, value.data);
    return value;
  },

  // Device equivalent of save() - delegates to DeviceStorage.createFile,
  // which already has this same fails-if-exists guard. Same `value` is a
  // DataResponse, failed `value` returned unwritten contract as save()
  // above. Same `.json`-default extension resolution and JSON-vs-raw-
  // string content handling as deviceGet (see withExtension/isJsonKey) -
  // `Cacher.deviceSave('images/avatar.png', DataResponse.success(
  // base64String))` writes exactly that string, not
  // `JSON.stringify(base64String)`.
  deviceSave: async <T>(key: string, value: DataResponse<T>): Promise<DataResponse<string>> => {
    if (isFailed(value)) {return value;}
    const path = withExtension(key);
    const jsonMode = isJsonKey(path);
    await ensureFolder(path);
    const content = jsonMode ? JSON.stringify(value.data) : (value.data as unknown as string);
    return DeviceStorage.createFile(deviceFile(path), content, jsonMode ? undefined : { encoding: 'base64' });
  },

  // Unconditional set - stores/overwrites `value` in memory, no existence
  // check, no loader. Same "value is a DataResponse, a failed one is
  // returned unwritten" contract as save().
  update: <T>(key: string, value: DataResponse<T>): DataResponse<T> => {
    if (isFailed(value)) {return value;}
    memoryStore.set(key, value.data);
    return value;
  },

  // Device equivalent of update() - delegates to DeviceStorage.updateFile
  // (unconditional create-or-overwrite). Same extension/content handling
  // as deviceSave, same failed-value-returned-unwritten contract as
  // save()/update().
  deviceUpdate: async <T>(key: string, value: DataResponse<T>): Promise<DataResponse<string>> => {
    if (isFailed(value)) {return value;}
    const path = withExtension(key);
    const jsonMode = isJsonKey(path);
    await ensureFolder(path);
    const content = jsonMode ? JSON.stringify(value.data) : (value.data as unknown as string);
    return DeviceStorage.updateFile(deviceFile(path), content, jsonMode ? undefined : { encoding: 'base64' });
  },

  // Drops `key` from the in-memory cache so the next get()/save() call
  // starts fresh instead of seeing a stale value.
  clear: (key: string): void => {
    memoryStore.delete(key);
    pendingLoads.delete(key);
  },

  // Deletes one cached entry from disk (same `.json`-default extension
  // resolution as deviceGet/deviceSave). Fails if nothing exists there
  // (same as DeviceStorage.delete, which this delegates straight to) -
  // "already gone" and "successfully deleted" leave the same end state,
  // so a failed result here is usually safe to ignore.
  deviceClear: (key: string): Promise<DataResponse<null>> => DeviceStorage.delete(deviceFile(withExtension(key))),

  // Wipes an entire folder-shaped key at once (everything under it, e.g.
  // every id saved as `${key}/${id}`) - same call as deviceClear, just
  // named for when that's the actual intent (clearing a whole tag) rather
  // than incidentally deleting one file. The folder is recreated lazily by
  // the next device* write for this key, not eagerly here.
  //
  // Deliberately does NOT go through withExtension, unlike every other
  // device* method above - `key` here names a *folder* (e.g.
  // CacheTags.SKILL_DETAILS, holding one file per id inside it), not a
  // file, so there's no "default to .json" to apply.
  deviceClean: (key: string): Promise<DataResponse<null>> => DeviceStorage.delete(deviceFile(key)),

  // Lists every id currently saved under a folder-shaped `key` (e.g.
  // every entry saved as `${key}/${id}`) - names only, one level, not
  // recursive. Delegates to DeviceStorage.listFiles. Same "no
  // withExtension" reasoning as deviceClean - `key` is a folder, and the
  // listed names already carry whatever extension each entry itself was
  // actually saved with (some '.json', maybe some '.png', ...).
  deviceGetFilesList: (key: string): Promise<DataResponse<string[]>> => DeviceStorage.listFiles(deviceFile(key)),
};

// --- Example (delete once real call sites exist) ---------------------------
//
// Used from XCases only, never XRepo - a Repo stays a plain data source,
// Cacher wraps the call *to* it one layer up. `id` concatenation is the
// caller's own job now - Cacher just takes whatever flat key you give it.
//
//   export const SkillDetailsCases = {
//     // `loader` resolves to a DataResponse directly - no manual
//     // isFailed/throw conversion needed, get()/deviceGet() check
//     // `.status` themselves.
//     getDetails: (id: string): Promise<DataResponse<SkillDetail>> =>
//       Cacher.deviceGet(`${CacheTags.SKILL_DETAILS}/${id}`, async () => {
//         const response = await SkillDetailsRepo.fetchSkillDetails(id); // DataResponse<Json>
//         if (isFailed(response)) {return response;}
//         return DataResponse.success(toSkillDetail(response.data)); // your own Json -> SkillDetail mapping
//       }),
//   };
//
// Listing every skill id cached so far - each returned name carries the
// '.json' extension deviceGet/deviceSave appended automatically (see
// withExtension), e.g. ["42.json", "107.json"], not bare ids:
//   const cached = await Cacher.deviceGetFilesList(CacheTags.SKILL_DETAILS);
//
// Saving something that isn't JSON (e.g. an image) just names its own
// extension explicitly - content is written/read as a raw string instead
// of being JSON.stringify/parse'd (see isJsonKey). `value`/the loader's
// resolved value is a DataResponse either way, same as everywhere else:
//   await Cacher.deviceSave(`images/${userId}.png`, DataResponse.success(base64EncodedBytes));
//   const avatar = await Cacher.deviceGet<string>(`images/${userId}.png`, () => fetchAvatarAsBase64(userId));
//
// A tag with only one value ever (nothing to pick between) just uses the
// bare tag as `key` - e.g. AboutYouCases.getDetails() would be
// `Cacher.deviceGet('about-you', () => ...)` (assuming AboutYouRepo itself
// is changed to resolve a DataResponse - its current mock just resolves
// the plain value, so wrap it with `DataResponse.success(...)` first), and
// its saveDetails() would call `Cacher.deviceClear('about-you')` before
// writing, so the next getDetails() doesn't return stale data.

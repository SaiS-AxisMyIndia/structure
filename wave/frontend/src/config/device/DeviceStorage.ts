import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';
import { Permissions } from '../permission/Permissions';
import { AppConstants } from '../constants/AppConstants';
import { FeaturesConfig } from '../flavour/FeaturesConfig';
import { DataResponse } from '../network/data_response';

// Encrypted read/write/update/delete access to this install's own private,
// persistent document directory on disk - not memory: anything written
// here survives an app restart (it's only gone if the app itself is
// uninstalled), unlike in-memory state which disappears the moment the
// process exits. A raw, generic file-storage primitive - no app-domain
// logic of its own (no tokens/user/settings the way AStorage.ts owns,
// no policy on what goes to disk vs. an in-memory cache - that's
// storage/Cacher.ts's job, built on top of this). Disk-space *info*
// (free/total bytes) lives in DeviceInfo.ts instead (same folder) - this
// file is only for actually writing to it.
//
// Every method returns Promise<DataResponse<T>> (see attempt() below) -
// nothing here ever throws/rejects out to a caller. Web platform errors,
// permission errors, native RNFS I/O failures (missing file, disk full,
// bad path, ...), decrypt failures (wrong/corrupted data), and JSON parse
// failures on readJSON all fail exactly the same way, through the same
// single mechanism - a caller checks one thing (isSuccess/isFailed, or
// `.status`) regardless of which of those actually went wrong, the same
// convention SecureCall.ts's own DataResponse<Json> calls already use.
//
// react-native-fs is native-only - no web polyfill exists for it the way
// react-native-device-info provides for DeviceInfo.ts's own calls, so
// every method below fails (not throws -
// see above) on web.
function assertNative(): void {
  if (Platform.OS === 'web') {
    throw new Error('File storage is only available on iOS/Android.');
  }
}

function pathFor(name: string): string {
  return `${RNFS.DocumentDirectoryPath}/${name}`;
}

// One AES key, generated once on first use and persisted in AsyncStorage -
// same "read fresh from storage, don't drift from what's persisted"
// reasoning AStorage.ts's own auth/refresh tokens already follow, plus an
// in-memory cache so every write/readFile call doesn't re-hit AsyncStorage
// for a value that never changes once generated.
//
// Caveat worth being explicit about: this is at-rest encryption, not
// hardware-KeyStore/Keychain-backed - the key itself lives in
// AsyncStorage, not a secure enclave. It protects against a file casually
// pulled off the device (a backup, USB file browsing, a rooted/jailbroken
// filesystem read) being plainly readable - it is not protection against
// an attacker who can also read this app's AsyncStorage.
let cachedKey: string | null = null;

async function getEncryptionKey(): Promise<string> {
  if (cachedKey) {return cachedKey;}
  let key = await AsyncStorage.getItem(AppConstants.storageKeys.fileEncryptionKey);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString(); // 256-bit, one per install
    await AsyncStorage.setItem(AppConstants.storageKeys.fileEncryptionKey, key);
  }
  cachedKey = key;
  return key;
}

async function encrypt(content: string): Promise<string> {
  const key = await getEncryptionKey();
  return CryptoJS.AES.encrypt(content, key).toString();
}

// Throws (caught uniformly by attempt() below, same as every other error
// case here) if `ciphertext` isn't valid ciphertext for the current key -
// wrong key or corrupted data decodes to bytes that generally aren't valid
// UTF-8, and CryptoJS's own .toString(Utf8) throws a "Malformed UTF-8
// data" error in that case rather than silently returning garbage.
async function decrypt(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  return CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
}

// Every disk-touching call below goes through this first - see
// Permissions.ts's own requestStorage() for why it's a real check point
// (private app storage needs no runtime OS grant today) rather than a
// no-op left out entirely: if this ever writes to shared/external storage
// instead, the real permission prompt plugs in at that one place, not
// scattered across every method here.
async function ensurePermission(): Promise<void> {
  assertNative();
  const result = await Permissions.request('storage');
  if (result !== 'granted') {
    throw new Error('Storage permission was not granted.');
  }
}

// The single place every public method's error handling goes through -
// runs `operation`, wraps whatever it resolves to as a success, and turns
// anything it throws (assertNative/ensurePermission's own errors, any
// native RNFS failure, a decrypt() failure, JSON.parse failing in
// readJSON, createFile's own "already exists" check, ...) into a failed
// DataResponse instead of letting it reject out to the caller.
async function attempt<T>(operation: () => Promise<T>): Promise<DataResponse<T>> {
  try {
    return DataResponse.success(await operation());
  } catch (err) {
    return DataResponse.failed(err instanceof Error ? err.message : 'File storage operation failed.');
  }
}

export type FileOptions = {
  encrypt?: boolean;
  encoding?: 'utf8' | 'base64' | 'ascii';
};

// The actual create-or-overwrite write, shared by createFile (after its
// own exists() guard) and updateFile/writeJSON (which write
// unconditionally, on purpose - see their own comments).
async function writeRaw(name: string, content: string, options?: FileOptions): Promise<string> {
  await ensurePermission();
  const path = pathFor(name);
  const shouldEncrypt = options?.encrypt ?? FeaturesConfig.encryptFileStorage;
  if (shouldEncrypt) {
    await RNFS.writeFile(path, await encrypt(content), 'utf8');
  } else {
    await RNFS.writeFile(path, content, options?.encoding ?? 'utf8');
  }
  return path;
}

// The actual read-and-decrypt, shared by readFile and readJSON.
async function readRaw(name: string, options?: FileOptions): Promise<string> {
  await ensurePermission();
  const shouldDecrypt = options?.encrypt ?? FeaturesConfig.encryptFileStorage;
  if (shouldDecrypt) {
    return decrypt(await RNFS.readFile(pathFor(name), 'utf8'));
  }
  return RNFS.readFile(pathFor(name), options?.encoding ?? 'utf8');
}

export const DeviceStorage = {
  getAppDirectory: (): Promise<DataResponse<string>> =>
    attempt(async () => {
      assertNative();
      return RNFS.DocumentDirectoryPath;
    }),

  // Creates `name` under the document directory - recursive, so a nested
  // path like 'exports/2026' works in one call the same way `mkdir -p`
  // does. Safe to call again on a folder that already exists: RNFS.mkdir
  // does not throw for an existing path (verified in its own docs, same
  // `mkdir -p` semantics) - it resolves as a no-op and leaves whatever is
  // already inside untouched, it does not clear/reset the folder. Data is
  // the full path created, so callers don't have to re-derive it
  // themselves from getAppDirectory().
  createFolder: (name: string): Promise<DataResponse<string>> =>
    attempt(async () => {
      await ensurePermission();
      const path = pathFor(name);
      await RNFS.mkdir(path);
      return path;
    }),

  // True create semantics: fails if `name` already exists instead of
  // silently overwriting it - RNFS.writeFile itself has no such guard
  // (see writeRaw above), so this checks first. Use updateFile/writeJSON
  // to intentionally overwrite something that's meant to already be
  // there.
  //
  // AES-encrypted by default - FeaturesConfig.encryptFileStorage (true for
  // every flavour today) is the fallback when `options.encrypt` is
  // omitted; pass an explicit `{ encrypt: false }` for the rare case one
  // particular file genuinely needs to stay in a foreign, readable-
  // elsewhere format. Whatever a file was written with, it must be read
  // back the same way - this has no way to detect after the fact whether
  // a given file's bytes are ciphertext or plain content.
  createFile: (name: string, content = '', options?: FileOptions): Promise<DataResponse<string>> =>
    attempt(async () => {
      if (await RNFS.exists(pathFor(name))) {
        throw new Error(`${name} already exists - use updateFile to overwrite it.`);
      }
      return writeRaw(name, content, options);
    }),

  // Unconditional create-or-overwrite, like Node's own fs.writeFile -
  // unlike createFile above, this never checks whether `name` already
  // exists: RNFS.writeFile always fully replaces the previous content
  // with the new content (verified in its own docs), it never merges/
  // appends, and this method's whole point is to let a caller do that on
  // purpose when its intent is "this already exists, change it" rather
  // than "make a new one". Same encrypt-by-default behavior as createFile.
  updateFile: (name: string, content: string, options?: FileOptions): Promise<DataResponse<string>> =>
    attempt(() => writeRaw(name, content, options)),

  // Reads back what createFile/updateFile wrote, decrypting by default
  // (same FeaturesConfig.encryptFileStorage fallback createFile uses) - a
  // round trip returns the original string unchanged as long as the same
  // `encrypt` option is used on both ends (see createFile's own comment).
  // Fails if `name` doesn't exist, or if it wasn't written with matching
  // encryption (not valid ciphertext for this key - see decrypt() above).
  readFile: (name: string, options?: FileOptions): Promise<DataResponse<string>> =>
    attempt(() => readRaw(name, options)),

  // JSON convenience over updateFile/readFile - most data crossing this
  // boundary is a structured object, not a raw string, so this folds the
  // JSON.stringify/parse conversion in rather than making every caller
  // repeat it. Unconditional overwrite like updateFile (not createFile's
  // guarded version) - the common cache-style "set this value" use case
  // shouldn't have to care whether a previous value already exists.
  // readJSON fails (same as everything else here) if the stored content
  // isn't valid JSON, not just if the file/decryption itself failed.
  writeJSON: <T>(name: string, value: T, options?: { encrypt?: boolean }): Promise<DataResponse<string>> =>
    attempt(() => writeRaw(name, JSON.stringify(value), options)),
  readJSON: <T>(name: string, options?: { encrypt?: boolean }): Promise<DataResponse<T>> =>
    attempt(async () => JSON.parse(await readRaw(name, options)) as T),

  // Whether a file/folder already exists at `name` under the document
  // directory - the natural "did createFolder/createFile actually persist
  // to real disk" check. Data is the true/false answer; this only fails
  // if the existence check itself couldn't run (web, or a native error) -
  // "the file doesn't exist" is itself a normal successful `false` result,
  // not a failure.
  exists: (name: string): Promise<DataResponse<boolean>> =>
    attempt(async () => {
      assertNative();
      return RNFS.exists(pathFor(name));
    }),

  // Deletes the file or folder at `name` (RNFS.unlink handles both,
  // recursively for a folder). Fails if nothing exists at that path -
  // callers unsure should check exists(name) first.
  delete: (name: string): Promise<DataResponse<null>> =>
    attempt(async () => {
      await ensurePermission();
      await RNFS.unlink(pathFor(name));
      return null;
    }),

  // Lists the names of files/folders directly inside the folder at `name`
  // (not full paths, not recursive - one level, same as RNFS.readdir).
  // Fails if `name` doesn't exist or isn't a folder.
  listFiles: (name: string): Promise<DataResponse<string[]>> =>
    attempt(async () => {
      await ensurePermission();
      return RNFS.readdir(pathFor(name));
    }),
};

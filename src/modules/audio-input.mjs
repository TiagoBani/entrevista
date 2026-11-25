import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

function directoryFor(dataDir, jobId) {
  if (!/^[a-zA-Z0-9-]+$/.test(jobId)) throw new Error('Invalid job id');
  return join(dataDir, 'jobs', jobId);
}

function safeName(name) {
  const base = String(name || '').split(/[\\/]/).at(-1);
  return base.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 120) || 'audio.mp3';
}

export async function receiveOriginal(request, jobId, displayName, dataDir) {
  const directory = directoryFor(dataDir, jobId);
  const tempPath = join(directory, 'original.part');
  await mkdir(directory, { recursive: true });
  try {
    await pipeline(request, createWriteStream(tempPath, { flags: 'wx' }));
    const { size } = await stat(tempPath, { bigint: true });
    return { tempPath, originalName: safeName(displayName), bytes: size };
  } catch (error) {
    if (error.code !== 'EEXIST') await rm(tempPath, { force: true });
    throw error;
  }
}

export async function commitOriginal(jobId, dataDir) {
  const directory = directoryFor(dataDir, jobId);
  const finalPath = join(directory, 'original.mp3');
  await rename(join(directory, 'original.part'), finalPath);
  return finalPath;
}

export async function discardOriginal(jobId, dataDir) {
  const directory = directoryFor(dataDir, jobId);
  await rm(join(directory, 'original.part'), { force: true });
}

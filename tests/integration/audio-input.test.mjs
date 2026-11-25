import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { commitOriginal, discardOriginal, receiveOriginal } from '../../src/modules/audio-input.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'audio-input-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('AUD-13 upload não impõe tamanho máximo', async (t) => {
  const directory = await fixture(t);
  const chunk = Buffer.alloc(1024 * 1024, 0x5a);
  const source = Readable.from((async function* () {
    for (let index = 0; index < 17; index += 1) yield chunk;
  })());

  const result = await receiveOriginal(source, 'large', 'large.mp3', directory);
  assert.equal(result.bytes, 17n * 1024n * 1024n);
  assert.equal((await stat(result.tempPath)).size, 17 * 1024 * 1024);
});

test('AUD-01 arquivo aceito é publicado somente após validação', async (t) => {
  const directory = await fixture(t);
  const result = await receiveOriginal(Readable.from([Buffer.from('audio')]), 'accepted', 'song.mp3', directory);
  const finalPath = join(directory, 'jobs', 'accepted', 'original.mp3');
  await assert.rejects(access(finalPath), { code: 'ENOENT' });

  assert.equal(await commitOriginal('accepted', directory), finalPath);
  assert.equal((await readFile(finalPath)).toString(), 'audio');
  assert.equal(result.originalName, 'song.mp3');
});

test('AUD-16 upload interrompido remove arquivo parcial', async (t) => {
  const directory = await fixture(t);
  const source = Readable.from((async function* () {
    yield Buffer.from('partial');
    throw new Error('connection lost');
  })());

  await assert.rejects(receiveOriginal(source, 'aborted', 'song.mp3', directory), /connection lost/);
  await assert.rejects(access(join(directory, 'jobs', 'aborted', 'original.part')), { code: 'ENOENT' });
  await assert.rejects(access(join(directory, 'jobs', 'aborted', 'original.mp3')), { code: 'ENOENT' });
  await assert.rejects(access(join(directory, 'jobs', 'aborted')), { code: 'ENOENT' });
});

test('AUD-16 nome e identificador não controlam caminhos do servidor', async (t) => {
  const directory = await fixture(t);
  const result = await receiveOriginal(Readable.from([Buffer.from('x')]), 'safe-id', '../bad\r\nname.mp3', directory);
  assert.equal(result.originalName, 'badname.mp3');
  assert.equal(result.tempPath, join(directory, 'jobs', 'safe-id', 'original.part'));
  await discardOriginal('safe-id', directory);
  await assert.rejects(access(result.tempPath), { code: 'ENOENT' });
  await assert.rejects(access(join(directory, 'jobs', 'safe-id')), { code: 'ENOENT' });
  await assert.rejects(
    receiveOriginal(Readable.from([Buffer.from('x')]), '../escape', 'x.mp3', directory),
    /Invalid job id/,
  );
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openJobStore } from '../../src/job-store.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'audio-jobs-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return join(directory, 'jobs.sqlite');
}

function job(id, createdAt = 1000) {
  return {
    id,
    originalName: `${id}.mp3`,
    originalBytes: 128,
    sampleRate: 44100,
    channels: 2,
    createdAt,
  };
}

test('AUD-07 lista mostra estados públicos', async (t) => {
  const store = openJobStore(await fixture(t));
  t.after(() => store.close());
  store.create(job('a'));
  store.create(job('b', 2000));
  store.transition('a', 'queued', 'processing', { phase: 'decoding' });
  store.transition('a', 'processing', 'completed', { outputBytes: 256 });

  assert.deepEqual(store.listPage().items.map(({ id, status }) => [id, status]), [
    ['b', 'queued'],
    ['a', 'completed'],
  ]);
  assert.equal(store.get('a').outputBytes, 256);
});

test('AUD-09 estados persistem após retorno', async (t) => {
  const path = await fixture(t);
  const first = openJobStore(path);
  first.create(job('saved'));
  first.transition('saved', 'queued', 'processing', { phase: 'encoding' });
  first.close();

  const reopened = openJobStore(path);
  t.after(() => reopened.close());
  assert.equal(reopened.get('saved').status, 'processing');
  assert.equal(reopened.get('saved').phase, 'encoding');
});

test('AUD-11 trabalhos antigos permanecem sem expiração', async (t) => {
  const store = openJobStore(await fixture(t));
  t.after(() => store.close());
  store.create(job('old', 1));
  store.create(job('new', Date.now()));

  assert.deepEqual(store.listPage().items.map(({ id }) => id), ['new', 'old']);
  assert.equal(store.get('old').originalName, 'old.mp3');
});

test('AUD-07 paginação alcança trabalhos antigos sem duplicar', async (t) => {
  const store = openJobStore(await fixture(t));
  t.after(() => store.close());
  for (let index = 0; index < 23; index += 1) {
    store.create(job(`job-${String(index).padStart(2, '0')}`, 1000));
  }

  const first = store.listPage();
  const second = store.listPage(first.nextCursor);
  assert.equal(first.items.length, 20);
  assert.equal(second.items.length, 3);
  assert.equal(new Set([...first.items, ...second.items].map(({ id }) => id)).size, 23);
  assert.equal(second.nextCursor, null);
});

test('AUD-09 transições são guardadas e trabalho interrompido volta à fila', async (t) => {
  const store = openJobStore(await fixture(t));
  t.after(() => store.close());
  store.create(job('interrupted'));
  assert.equal(store.transition('interrupted', 'queued', 'completed'), false);
  assert.equal(store.get('interrupted').status, 'queued');
  assert.equal(store.transition('interrupted', 'queued', 'processing', { phase: 'reversing' }), true);
  assert.equal(store.setPhase('interrupted', 'encoding'), true);
  assert.equal(store.get('interrupted').phase, 'encoding');
  assert.equal(store.requeueInterrupted(), 1);
  assert.equal(store.get('interrupted').status, 'queued');
  assert.equal(store.get('interrupted').phase, null);
});

import { publicSnapshot } from './publicSnapshot.js';

export async function publishSnapshot({ path, state, token, write, now = Date.now() }) {
  if (!/^[a-f0-9]{48}$/.test(token)) throw new Error('Invalid share token');
  const snapshot = publicSnapshot(state, now);
  const meta = { token, publishedAt: snapshot.publishedAt };
  await write({ [`${path}Public/${token}`]: snapshot, [`${path}/shareLink`]: meta });
  return meta;
}

export async function revokeSnapshot({ path, token, write }) {
  if (!/^[a-f0-9]{48}$/.test(token)) throw new Error('Invalid share token');
  await write({ [`${path}Public/${token}`]: null, [`${path}/shareLink`]: null });
}

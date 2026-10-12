jest.mock('./env', () => ({ env: {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'synthetic-test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key',
  SUPABASE_STORAGE_BUCKET: 'public-assets',
  SUPABASE_PRIVATE_STORAGE_BUCKET: 'private-media',
} }));
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ storage: {
  listBuckets: jest.fn(), createBucket: jest.fn(), getBucket: jest.fn(), from: jest.fn(),
} })) }));

import { env } from './env';
import { ensureStorageBuckets, privateMedia, supabaseAdmin } from './supabase';

const storage = supabaseAdmin.storage as unknown as Record<string, jest.Mock>;
const publicBucket = { id: 'public-assets', name: 'public-assets', public: true };
const privateBucket = { id: 'private-media', name: 'private-media', public: false };

beforeEach(() => {
  jest.resetAllMocks();
  env.SUPABASE_PRIVATE_STORAGE_BUCKET = 'private-media';
  storage.listBuckets.mockResolvedValue({ data: [publicBucket, privateBucket], error: null });
  storage.createBucket.mockResolvedValue({ error: null });
  storage.getBucket.mockImplementation(async name => ({ data: name === 'public-assets' ? publicBucket : privateBucket, error: null }));
});

describe('Storage initialization', () => {
  it('leaves correctly configured existing buckets unchanged', async () => {
    await ensureStorageBuckets();
    expect(storage.createBucket).not.toHaveBeenCalled();
  });
  it('creates and verifies both buckets with explicit visibility', async () => {
    storage.listBuckets.mockResolvedValue({ data: [], error: null });
    await ensureStorageBuckets();
    expect(storage.createBucket.mock.calls).toEqual([
      ['public-assets', { public: true }], ['private-media', { public: false }],
    ]);
    expect(storage.getBucket).toHaveBeenCalledTimes(2);
  });
  it('accepts a concurrent create only after reading back correct visibility', async () => {
    storage.listBuckets.mockResolvedValue({ data: [publicBucket], error: null });
    storage.createBucket.mockResolvedValue({ error: { message: 'Already exists' } });
    await ensureStorageBuckets();
    expect(storage.getBucket).toHaveBeenCalledWith('private-media');
  });
  it('rejects identical public/private names before any network operation', async () => {
    env.SUPABASE_PRIVATE_STORAGE_BUCKET = 'public-assets';
    await expect(ensureStorageBuckets()).rejects.toThrow('distinct names');
    expect(storage.listBuckets).not.toHaveBeenCalled();
  });
  it('rejects an existing private-media bucket exposed publicly', async () => {
    storage.listBuckets.mockResolvedValue({ data: [publicBucket, { ...privateBucket, public: true }], error: null });
    await expect(ensureStorageBuckets()).rejects.toThrow('visibility mismatch');
  });
  it('does not make a private bucket public just because the name matches', async () => {
    storage.listBuckets.mockResolvedValue({ data: [{ ...publicBucket, public: false }, privateBucket], error: null });
    await expect(ensureStorageBuckets()).rejects.toThrow('visibility mismatch');
    expect(storage.createBucket).not.toHaveBeenCalled();
  });
  it('fails closed on list failures without echoing provider details', async () => {
    storage.listBuckets.mockResolvedValue({ data: null, error: { message: 'sensitive provider details' } });
    await expect(ensureStorageBuckets()).rejects.toThrow(/^Supabase Storage unavailable$/);
  });
  it('fails closed when provisioning cannot be verified', async () => {
    storage.listBuckets.mockResolvedValue({ data: [publicBucket], error: null });
    storage.createBucket.mockResolvedValue({ error: { message: 'denied' } });
    storage.getBucket.mockResolvedValue({ data: null, error: { message: 'denied' } });
    await expect(ensureStorageBuckets()).rejects.toThrow('provisioning failed');
  });
  it('rejects a bucket created concurrently with unsafe visibility', async () => {
    storage.listBuckets.mockResolvedValue({ data: [publicBucket], error: null });
    storage.getBucket.mockResolvedValue({ data: { ...privateBucket, public: true }, error: null });
    await expect(ensureStorageBuckets()).rejects.toThrow('visibility mismatch');
  });
});

describe('Private media authorization boundary', () => {
  it.each(['private://other/delivery/audio/file.mp3', 'private://tenant/other/audio/file.mp3', 'private://tenant/delivery/audio/../file.mp3'])(
    'rejects out-of-scope path %s before signing', async value => {
      await expect(privateMedia.resolve(value, 'tenant', 'delivery')).rejects.toThrow('Invalid private media scope');
      expect(storage.from).not.toHaveBeenCalled();
    },
  );
  it('signs only scoped private media with a five minute expiry', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({ data: { signedUrl: 'https://example.invalid/signed' }, error: null });
    storage.from.mockReturnValue({ createSignedUrl });
    await expect(privateMedia.resolve('private://tenant/delivery/audio/file.mp3', 'tenant', 'delivery')).resolves.toBe('https://example.invalid/signed');
    expect(storage.from).toHaveBeenCalledWith('private-media');
    expect(createSignedUrl).toHaveBeenCalledWith('tenant/delivery/audio/file.mp3', 300);
  });
  it('refuses signing if the private bucket becomes public', async () => {
    storage.getBucket.mockResolvedValue({ data: { ...privateBucket, public: true }, error: null });
    await expect(privateMedia.resolve('private://tenant/delivery/audio/file.mp3', 'tenant', 'delivery')).rejects.toThrow('Private media storage unavailable');
    expect(storage.from).not.toHaveBeenCalled();
  });
});

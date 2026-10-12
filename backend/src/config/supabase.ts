// apps/backend/src/config/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Create Supabase client with service role key (full access)
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create Supabase client with anon key (for public operations)
export const supabaseClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

/**
 * Ensure the Storage buckets required by the application exist.
 * This is intentionally idempotent and uses the official Storage API so a
 * fresh Supabase project can be provisioned safely during application startup.
 */
export async function ensureStorageBuckets(): Promise<void> {
  const required = [
    { name: env.SUPABASE_STORAGE_BUCKET, public: true },
    { name: env.SUPABASE_PRIVATE_STORAGE_BUCKET, public: false },
  ];
  if (!required[0].name || !required[1].name || required[0].name === required[1].name) {
    throw new Error('Public and private Storage buckets must have distinct names');
  }
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError || !buckets) throw new Error('Supabase Storage unavailable');
  for (const bucket of required) {
    let existing = buckets.find(item => item.id === bucket.name);
    if (!existing) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket.name, { public: bucket.public });
      // Read back even after a duplicate error: another instance can provision concurrently.
      const { data, error } = await supabaseAdmin.storage.getBucket(bucket.name);
      if (error || !data) throw new Error(createError ? 'Storage bucket provisioning failed' : 'Storage bucket verification failed');
      existing = data;
    }
    // Never make an existing bucket public or trust a private bucket's name alone.
    if (existing.public !== bucket.public) throw new Error('Storage bucket visibility mismatch');
  }
}

// Storage helper functions
export const storage = {
  bucket: env.SUPABASE_STORAGE_BUCKET,

  /**
   * Upload a file to Supabase Storage
   */
  async upload(
    path: string,
    file: Buffer | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ) {
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    const { data } = supabaseAdmin.storage
      .from(this.bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  /**
   * Delete a file from storage
   */
  async delete(path: string) {
    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .remove([path]);

    if (error) throw error;
  },

  /**
   * Delete multiple files from storage
   */
  async deleteMany(paths: string[]) {
    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .remove(paths);

    if (error) throw error;
  },

  /**
   * List files in a folder
   */
  async list(folder: string, options?: { limit?: number; offset?: number }) {
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .list(folder, {
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Generate a signed URL for private files
   */
  async getSignedUrl(path: string, expiresIn: number = 3600) {
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },
};

export default supabaseAdmin;

// Sensitive delivery media must never fall back to the public branding bucket.
export const privateMedia = {
  async bucket(): Promise<ReturnType<SupabaseClient['storage']['from']>> {
    const name = env.SUPABASE_PRIVATE_STORAGE_BUCKET;
    const { data, error } = await supabaseAdmin.storage.getBucket(name);
    if (error || !data || data.public) throw new Error('Private media storage unavailable');
    return supabaseAdmin.storage.from(name);
  },
  async upload(path: string, bytes: Buffer, contentType: string) {
    const bucket = await this.bucket();
    const { error } = await bucket.upload(path, bytes, { contentType, upsert: false });
    if (error) throw new Error('Private media upload failed');
    return `private://${path}`;
  },
  async resolve(value: string | null | undefined, tenantId: string, deliveryId: string) {
    if (!value?.startsWith('private://')) return value;
    const path = value.slice('private://'.length);
    if (!path.startsWith(`${tenantId}/${deliveryId}/audio/`) || path.includes('..')) {
      throw new Error('Invalid private media scope');
    }
    const bucket = await this.bucket();
    const { data, error } = await bucket.createSignedUrl(path, 300);
    if (error || !data) throw new Error('Private media unavailable');
    return data.signedUrl;
  },
};

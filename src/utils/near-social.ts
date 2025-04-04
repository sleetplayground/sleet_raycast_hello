import { Social } from '@builddao/near-social-js';

export interface Profile {
  accountId: string;
  name?: string;
  image?: { ipfs_cid: string };
  description?: string;
  linktree?: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  tags?: Record<string, string>;
}

export interface FetchProfilesOptions {
  limit?: number;
  fromIndex?: string | null;
}

export interface ProfilesResponse {
  profiles: Profile[];
  lastAccountId: string | null;
}

export async function fetchNearSocialProfiles(options: FetchProfilesOptions = {}): Promise<ProfilesResponse> {
  try {
    const batchSize = options.limit || 10;
    const social = new Social({
      network: 'mainnet',
      contractId: 'social.near'
    });

    const searchResults = await social.get({
      keys: [`*/profile/*`],
      limit: batchSize,
      from: options.fromIndex,
      subscribe: false
    });

    if (!searchResults || typeof searchResults !== 'object') {
      throw new Error('Invalid profile data format: expected an object');
    }

    // Process profiles in smaller chunks to manage memory
    const entries = Object.entries(searchResults);
    const chunks = [];
    const chunkSize = 10;

    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      const processedChunk = chunk
        .map(([accountId, data]: [string, any]) => {
          if (!data || typeof data !== 'object' || !data.profile) {
            return null;
          }
          return {
            accountId,
            ...data.profile
          };
        })
        .filter((profile): profile is Profile => profile !== null);
      chunks.push(...processedChunk);
    }

    // Get the last accountId for pagination
    const lastEntry = entries[entries.length - 1];
    const lastAccountId = lastEntry ? lastEntry[0] : null;

    return {
      profiles: chunks,
      lastAccountId
    };
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
}
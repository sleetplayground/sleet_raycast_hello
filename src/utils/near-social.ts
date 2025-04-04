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

export async function fetchNearSocialProfiles(): Promise<Profile[]> {
  try {
    const social = new Social({
      network: 'mainnet',
      contractId: 'social.near'
    });

    const searchResults = await social.get({
      keys: [`*/profile/*`]
    });

    if (!searchResults || typeof searchResults !== 'object') {
      throw new Error('Invalid profile data format: expected an object');
    }

    const profileList = Object.entries(searchResults)
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

    return profileList;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
}
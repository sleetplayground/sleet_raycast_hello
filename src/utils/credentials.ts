import fs from "fs-extra";
import path from "path";
import os from "os";

interface NearCredential {
  account_id: string;
  public_key: string;
  private_key: string;
  network_id: string;
  label?: string;
}

interface AccountsJson {
  [key: string]: {
    label?: string;
  };
}

let CREDENTIALS_DIR = path.join(os.homedir(), ".near-credentials");

export function setCredentialsPath(customPath: string) {
  CREDENTIALS_DIR = customPath;
  console.log(`Credentials directory set to: ${CREDENTIALS_DIR}`);
}

export async function getNetworkAccounts(networkId: string): Promise<NearCredential[]> {
  console.log(`Searching for accounts in: ${CREDENTIALS_DIR}`);

  // Only allow mainnet and testnet networks
  if (networkId !== 'mainnet' && networkId !== 'testnet') {
    console.log(`Invalid network ID: ${networkId}. Only mainnet and testnet are supported.`);
    return [];
  }

  try {
    const networkDir = path.join(CREDENTIALS_DIR, networkId);
    if (!fs.existsSync(networkDir)) {
      console.log(`No credentials directory found for network: ${networkId}`);
      return [];
    }

    const accountsJsonPath = path.join(CREDENTIALS_DIR, "accounts.json");
    let accountsJson: AccountsJson = {};
    try {
      if (fs.existsSync(accountsJsonPath)) {
        accountsJson = await fs.readJSON(accountsJsonPath);
        console.log(`Found accounts.json with ${Object.keys(accountsJson).length} entries`);
      }
    } catch (error) {
      console.error(`Error reading accounts.json:`, error);
    }

    const files = await fs.readdir(networkDir);
    console.log(`Found ${files.length} files in ${networkDir}`);
    const credentials: NearCredential[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(networkDir, file);
        const stats = await fs.stat(filePath);
        
        // Skip directories, only process JSON files
        if (stats.isDirectory()) continue;
        
        const accountId = file.replace('.json', '');
        const cred = await fs.readJSON(filePath);
        
        if (cred && cred.account_id) {
          const credential: NearCredential = {
            account_id: accountId,
            public_key: cred.public_key,
            private_key: cred.private_key,
            network_id: networkId,
            label: accountsJson[accountId]?.label || accountId
          };
          console.log(`Found valid credential for account: ${accountId}`);
          credentials.push(credential);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    console.log(`Found ${credentials.length} accounts for network ${networkId}`);
    return credentials;
  } catch (error) {
    console.error(`Error getting accounts for network ${networkId}:`, error);
    return [];
  }
}

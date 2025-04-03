import fs from 'fs-extra';
import path from 'path';
import os from 'os';

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

const CREDENTIALS_DIR = path.join(os.homedir(), '.near-credentials');
const ACCOUNTS_JSON = path.join(CREDENTIALS_DIR, 'accounts.json');

export async function getNetworkAccounts(networkId: string): Promise<NearCredential[]> {
  const networkDir = path.join(CREDENTIALS_DIR, networkId);
  if (!fs.existsSync(networkDir)) return [];

  const accountsJson: AccountsJson = fs.existsSync(ACCOUNTS_JSON)
    ? await fs.readJSON(ACCOUNTS_JSON)
    : {};

  const files = await fs.readdir(networkDir);
  const credentials: NearCredential[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const accountId = file.replace('.json', '');
    const filePath = path.join(networkDir, file);

    try {
      const cred = await fs.readJSON(filePath);
      credentials.push({
        ...cred,
        account_id: accountId,
        network_id: networkId,
        label: accountsJson[accountId]?.label || accountId,
      });
    } catch (error) {
      console.error(`Error reading credential file ${filePath}:`, error);
    }
  }

  return credentials;
}

export async function getAllAccounts(): Promise<NearCredential[]> {
  const networks = ['mainnet', 'testnet'];
  const allCredentials: NearCredential[] = [];

  for (const network of networks) {
    const networkCredentials = await getNetworkAccounts(network);
    allCredentials.push(...networkCredentials);
  }

  return allCredentials;
}

export async function updateAccountLabel(accountId: string, label: string): Promise<void> {
  const accountsJson: AccountsJson = fs.existsSync(ACCOUNTS_JSON)
    ? await fs.readJSON(ACCOUNTS_JSON)
    : {};

  accountsJson[accountId] = { ...accountsJson[accountId], label };
  await fs.writeJSON(ACCOUNTS_JSON, accountsJson, { spaces: 2 });
}
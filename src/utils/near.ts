import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { connect, keyStores, utils, providers } from "near-api-js";
import { showToast, Toast, getPreferenceValues } from "@raycast/api";

// Define preference types
export interface NetworkPreferences {
  networkId: string;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
}

export interface Preferences extends NetworkPreferences {
  accountId: string;
  contractName: string;
  useExistingCredentials: boolean;
}

// Get user preferences
export function getNetworkConfig(): NetworkPreferences {
  const preferences = getPreferenceValues<Preferences>();

  // Default configurations if not provided
  const networkId = preferences.networkId || "testnet";
  const nodeUrl =
    preferences.nodeUrl || (networkId === "mainnet" ? "https://rpc.mainnet.near.org" : "https://rpc.testnet.near.org");
  const walletUrl =
    preferences.walletUrl || (networkId === "mainnet" ? "https://wallet.near.org" : "https://wallet.testnet.near.org");
  const helperUrl =
    preferences.helperUrl ||
    (networkId === "mainnet" ? "https://helper.mainnet.near.org" : "https://helper.testnet.near.org");
  const explorerUrl =
    preferences.explorerUrl ||
    (networkId === "mainnet" ? "https://explorer.near.org" : "https://explorer.testnet.near.org");

  return {
    networkId,
    nodeUrl,
    walletUrl,
    helperUrl,
    explorerUrl,
  };
}

// Get contract name from preferences
export function getContractName(): string {
  const preferences = getPreferenceValues<Preferences>();
  const networkId = preferences.networkId || "testnet";

  // Default contract name based on network
  return preferences.contractName || (networkId === "mainnet" ? "hello.sleet.near" : "hello.sleet.testnet");
}

// Path to NEAR credentials directory
export function getNearCredentialsDir(): string {
  return path.join(os.homedir(), ".near-credentials");
}

// List available accounts from credentials directory
export async function listAvailableAccounts(): Promise<string[]> {
  try {
    const credentialsDir = getNearCredentialsDir();
    const accounts: string[] = [];

    // Check if credentials directory exists
    if (!(await fs.pathExists(credentialsDir))) {
      return [];
    }

    // Get network directories (mainnet, testnet, etc.)
    const networkDirs = await fs.readdir(credentialsDir);

    for (const networkDir of networkDirs) {
      // Skip non-directory items and special files
      if (networkDir === "accounts.json" || networkDir === "implicit") {
        continue;
      }

      const networkPath = path.join(credentialsDir, networkDir);
      const stat = await fs.stat(networkPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(networkPath);

        for (const file of files) {
          // Only process JSON files and skip directories
          if (file.endsWith(".json")) {
            const accountId = file.replace(".json", "");
            accounts.push(`${accountId} (${networkDir})`);
          }
        }
      }
    }

    return accounts;
  } catch (error) {
    console.error("Error listing NEAR accounts:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to list NEAR accounts",
      message: String(error),
    });
    return [];
  }
}

// Initialize NEAR connection
export async function initNear() {
  try {
    const networkConfig = getNetworkConfig();
    const keyStore = new keyStores.UnencryptedFileSystemKeyStore(getNearCredentialsDir());

    const config = {
      ...networkConfig,
      keyStore,
      headers: {},
    };

    return await connect(config);
  } catch (error) {
    console.error("Error initializing NEAR connection:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to initialize NEAR connection",
      message: String(error),
    });
    throw error;
  }
}

// Get account details
export async function getAccountDetails(accountId: string, networkId: string) {
  try {
    const provider = new providers.JsonRpcProvider({
      url: networkId === "mainnet" ? "https://rpc.mainnet.near.org" : "https://rpc.testnet.near.org",
    });

    const account = await provider.query({
      request_type: "view_account",
      finality: "final",
      account_id: accountId,
    });

    return account;
  } catch (error) {
    console.error(`Error getting account details for ${accountId}:`, error);
    return null;
  }
}

// Load credentials for a specific account
export async function loadCredentials(accountId: string, networkId: string) {
  try {
    const credentialsPath = path.join(getNearCredentialsDir(), networkId, `${accountId}.json`);

    if (await fs.pathExists(credentialsPath)) {
      const credentialsContent = await fs.readFile(credentialsPath, "utf8");
      return JSON.parse(credentialsContent);
    }

    // Check if there's a directory with account name that contains key files
    const accountDirPath = path.join(getNearCredentialsDir(), networkId, accountId);
    if (await fs.pathExists(accountDirPath)) {
      const keyFiles = await fs.readdir(accountDirPath);
      if (keyFiles.length > 0) {
        // Return the first key file found
        const keyFilePath = path.join(accountDirPath, keyFiles[0]);
        const keyFileContent = await fs.readFile(keyFilePath, "utf8");
        return JSON.parse(keyFileContent);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error loading credentials for ${accountId}:`, error);
    return null;
  }
}

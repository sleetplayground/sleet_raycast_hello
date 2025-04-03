import { homedir } from "os";
import { join } from "path";
import { readFileSync, readdirSync } from "fs";

interface AccountCredentials {
  account_id: string;
  public_key: string;
  private_key: string;
}

interface NetworkCredentials {
  [accountId: string]: AccountCredentials;
}

export function getAvailableAccounts(networkId: string): AccountCredentials[] {
  try {
    const credentialsPath = join(homedir(), ".near-credentials", networkId);
    const files = readdirSync(credentialsPath);
    
    const accounts: AccountCredentials[] = [];
    
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        try {
          const filePath = join(credentialsPath, file);
          const content = readFileSync(filePath, "utf8");
          const credentials = JSON.parse(content) as AccountCredentials;
          accounts.push(credentials);
        } catch (error) {
          console.error(`Error reading credentials file ${file}:`, error);
        }
      }
    });
    
    return accounts;
  } catch (error) {
    console.error("Error reading credentials directory:", error);
    return [];
  }
}
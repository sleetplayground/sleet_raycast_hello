import { showToast, Toast, getPreferenceValues, showHUD, Form, ActionPanel, Action } from '@raycast/api';
import { useForm } from '@raycast/utils';
import * as fs from 'fs-extra';
import * as path from 'path';
import { KeyPair } from 'near-api-js';
import { getNetworkConfig, getNearCredentialsDir, initNear, Preferences } from './utils/near';

interface LoginFormValues {
  accountId: string;
  privateKey: string;
  networkId: string;
  useExistingCredentials: boolean;
}

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const networkConfig = getNetworkConfig();
    const networkId = networkConfig.networkId;
    const useExistingCredentials = preferences.useExistingCredentials !== false;
    
    // If using existing credentials, show a list of available accounts
    if (useExistingCredentials) {
      await loginWithExistingCredentials();
    } else {
      // Otherwise, prompt for account ID and private key
      await showToast({
        style: Toast.Style.Animated,
        title: 'Please enter your NEAR account credentials',
      });
      
      // This would typically show a form, but since Raycast extensions with no-view mode
      // don't support forms directly, we'd need to implement this differently
      // For now, we'll just show a message
      await showHUD('Login with private key is not implemented in no-view mode');
    }
  } catch (error) {
    console.error('Error during login:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Login failed',
      message: String(error),
    });
  }
}

async function loginWithExistingCredentials() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const networkId = preferences.networkId || 'testnet';
    const credentialsDir = getNearCredentialsDir();
    const networkDir = path.join(credentialsDir, networkId);
    
    // Check if credentials directory exists
    if (!await fs.pathExists(networkDir)) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No credentials found',
        message: `No NEAR credentials found for ${networkId} network`,
      });
      return;
    }
    
    // Read all files in the network directory
    const files = await fs.readdir(networkDir);
    const accountFiles = files.filter(file => file.endsWith('.json'));
    
    if (accountFiles.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No accounts found',
        message: `No NEAR accounts found for ${networkId} network`,
      });
      return;
    }
    
    // For simplicity, we'll just use the first account found
    // In a real implementation, you might want to let the user choose
    const accountFile = accountFiles[0];
    const accountId = accountFile.replace('.json', '');
    
    // Load the account credentials
    const credentialsPath = path.join(networkDir, accountFile);
    const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    // Initialize NEAR connection
    const near = await initNear();
    
    // Verify the account exists
    try {
      const account = await near.account(accountId);
      await account.state();
      
      await showToast({
        style: Toast.Style.Success,
        title: 'Login successful',
        message: `Logged in as ${accountId} on ${networkId}`,
      });
    } catch (error) {
      console.error('Error verifying account:', error);
      await showToast({
        style: Toast.Style.Failure,
        title: 'Account verification failed',
        message: String(error),
      });
    }
  } catch (error) {
    console.error('Error during login with existing credentials:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Login failed',
      message: String(error),
    });
  }
}

async function saveCredentials(accountId: string, privateKey: string, networkId: string) {
  try {
    const credentialsDir = getNearCredentialsDir();
    const networkDir = path.join(credentialsDir, networkId);
    
    // Create directories if they don't exist
    await fs.ensureDir(networkDir);
    
    // Create key pair from private key
    const keyPair = KeyPair.fromString(privateKey);
    const publicKey = keyPair.getPublicKey().toString();
    
    // Create credentials object
    const credentials = {
      account_id: accountId,
      public_key: publicKey,
      private_key: privateKey,
    };
    
    // Save credentials to file
    const credentialsPath = path.join(networkDir, `${accountId}.json`);
    await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2));
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Credentials saved',
      message: `Credentials for ${accountId} saved successfully`,
    });
  } catch (error) {
    console.error('Error saving credentials:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Failed to save credentials',
      message: String(error),
    });
  }
}
import { showToast, Toast, getPreferenceValues, showHUD } from '@raycast/api';
import { KeyPair, utils } from 'near-api-js';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getNetworkConfig, getNearCredentialsDir, initNear, Preferences } from './utils/near';

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const networkConfig = getNetworkConfig();
    const networkId = networkConfig.networkId;
    
    // In a real implementation, you would prompt for these values
    // Since we're in no-view mode, we'll use default values for demonstration
    const accountId = `raycast-${Date.now()}.sleet.${networkId === 'mainnet' ? 'near' : 'testnet'}`;
    
    await showToast({
      style: Toast.Style.Animated,
      title: 'Creating new account',
      message: `Account ID: ${accountId}`,
    });
    
    // Generate a new key pair
    const keyPair = KeyPair.fromRandom('ed25519');
    const publicKey = keyPair.getPublicKey().toString();
    const privateKey = keyPair.toString();
    
    // Initialize NEAR connection
    const near = await initNear();
    
    // Get the first available account to use as the creator
    const creatorAccountId = await getFirstAvailableAccount(networkId);
    
    if (!creatorAccountId) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No account available',
        message: 'Please login first to create a new account',
      });
      return;
    }
    
    // Get the creator account
    const creatorAccount = await near.account(creatorAccountId);
    
    // Create the new account
    // Note: This is a simplified implementation
    // In a real app, you would need to handle the account creation process properly
    // This might involve calling a contract or using a helper service
    try {
      await creatorAccount.createAccount(
        accountId,
        publicKey,
        utils.format.parseNearAmount('0.1')! // Initial balance of 0.1 NEAR
      );
      
      // Save the credentials
      await saveCredentials(accountId, privateKey, networkId);
      
      await showHUD(`Account created: ${accountId}\nPrivate key saved to .near-credentials`);
      
      await showToast({
        style: Toast.Style.Success,
        title: 'Account created',
        message: `Account ID: ${accountId}`,
      });
    } catch (error) {
      console.error('Error creating account:', error);
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to create account',
        message: String(error),
      });
    }
  } catch (error) {
    console.error('Error in create account command:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Error creating account',
      message: String(error),
    });
  }
}

async function getFirstAvailableAccount(networkId: string): Promise<string | null> {
  try {
    const near = await initNear();
    const keyStore = near.connection.signer.keyStore;
    
    // Get all keys
    const keys = await keyStore.getAccounts(networkId);
    
    if (keys.length > 0) {
      return keys[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting available accounts:', error);
    return null;
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
    
    console.log(`Credentials saved to ${credentialsPath}`);
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
}
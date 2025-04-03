import { showToast, Toast, getPreferenceValues, showHUD } from '@raycast/api';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { getNetworkConfig, getNearCredentialsDir, listAvailableAccounts, Preferences } from './utils/near';

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const networkId = preferences.networkId || 'testnet';
    
    // Get list of available accounts
    const accounts = await listAvailableAccounts();
    
    if (accounts.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No accounts found',
        message: `No NEAR accounts found in your credentials directory`,
      });
      return;
    }
    
    // Format the accounts list
    const accountsList = accounts.join('\n');
    
    // Show the list of accounts
    await showHUD(`Available NEAR Accounts:\n\n${accountsList}`);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Accounts found',
      message: `Found ${accounts.length} NEAR accounts`,
    });
  } catch (error) {
    console.error('Error listing accounts:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Failed to list accounts',
      message: String(error),
    });
  }
}
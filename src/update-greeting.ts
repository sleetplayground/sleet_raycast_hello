import { showToast, Toast, getPreferenceValues, showHUD, Form, ActionPanel, Action } from '@raycast/api';
import { initNear, getNetworkConfig, getContractName, Preferences } from './utils/near';
import { utils } from 'near-api-js';

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const networkConfig = getNetworkConfig();
    const contractName = getContractName();
    
    // Initialize NEAR connection
    const near = await initNear();
    
    // Prompt for the new greeting
    // Since we're in no-view mode, we'll use showHUD to get input
    // In a real implementation, you might want to use a form
    const newGreeting = await promptForGreeting();
    
    if (!newGreeting) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Update cancelled',
        message: 'No greeting provided',
      });
      return;
    }
    
    await showToast({
      style: Toast.Style.Animated,
      title: 'Updating greeting',
      message: `On ${contractName} (${networkConfig.networkId})`,
    });
    
    // Get the first available account
    const accountId = await getFirstAvailableAccount(networkConfig.networkId);
    
    if (!accountId) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No account available',
        message: 'Please login first',
      });
      return;
    }
    
    // Get the account object
    const account = await near.account(accountId);
    
    // Call the contract method
    const result = await account.functionCall({
      contractId: contractName,
      methodName: 'set_greeting',
      args: { greeting: newGreeting },
      gas: utils.format.parseNearAmount('0.00000000003')!, // 30 Tgas
      attachedDeposit: utils.format.parseNearAmount('0')!, // 0 NEAR
    });
    
    // Show success message
    await showHUD(`Greeting updated to: ${newGreeting}`);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Greeting updated',
      message: `Transaction ID: ${result.transaction_outcome.id}`,
    });
  } catch (error) {
    console.error('Error updating greeting:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Failed to update greeting',
      message: String(error),
    });
  }
}

async function promptForGreeting(): Promise<string | null> {
  // In a no-view command, we can't show a form
  // This is a simplified implementation
  // In a real app, you might want to use a different approach
  return 'Hello from Raycast!';
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
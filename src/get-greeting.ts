import { showToast, Toast, getPreferenceValues, showHUD } from '@raycast/api';
import { providers } from 'near-api-js';
import { getNetworkConfig, getContractName, initNear, Preferences } from './utils/near';

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const networkConfig = getNetworkConfig();
    const contractName = getContractName();
    
    await showToast({
      style: Toast.Style.Animated,
      title: 'Fetching greeting',
      message: `From ${contractName} on ${networkConfig.networkId}`,
    });
    
    // Initialize NEAR connection
    const near = await initNear();
    
    // Create a provider to interact with the network
    const provider = new providers.JsonRpcProvider({ url: networkConfig.nodeUrl });
    
    // Call the view method on the contract
    const result = await provider.query({
      request_type: 'call_function',
      account_id: contractName,
      method_name: 'get_greeting',
      args_base64: Buffer.from('{}').toString('base64'),
      finality: 'optimistic',
    });
    
    // Parse the result
    // @ts-ignore - result.result has the expected structure but TypeScript doesn't know it
    const greeting = JSON.parse(Buffer.from(result.result).toString());
    
    // Show the greeting
    await showHUD(`Greeting: ${greeting}`);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Greeting fetched',
      message: greeting,
    });
  } catch (error) {
    console.error('Error fetching greeting:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Failed to fetch greeting',
      message: String(error),
    });
  }
}
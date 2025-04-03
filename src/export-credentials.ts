import { showToast, Toast, getPreferenceValues, showHUD, open } from '@raycast/api';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { getNetworkConfig, getNearCredentialsDir, loadCredentials, Preferences } from './utils/near';

export default async function Command() {
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
    
    // Create markdown content
    let markdownContent = `# NEAR Credentials Backup\n\n`;
    markdownContent += `Network: **${networkId}**\n\n`;
    markdownContent += `Date: ${new Date().toLocaleString()}\n\n`;
    markdownContent += `## Accounts\n\n`;
    
    // Process each account
    for (const accountFile of accountFiles) {
      const accountId = accountFile.replace('.json', '');
      const credentials = await loadCredentials(accountId, networkId);
      
      if (credentials) {
        markdownContent += `### ${accountId}\n\n`;
        markdownContent += `- **Public Key**: ${credentials.public_key}\n`;
        markdownContent += `- **Private Key**: ${credentials.private_key}\n\n`;
      }
    }
    
    markdownContent += `## Important Security Notice\n\n`;
    markdownContent += `This file contains sensitive information. Keep it secure and do not share it with anyone.\n`;
    markdownContent += `Your private keys provide full access to your NEAR accounts and funds.\n`;
    
    // Save markdown file to Downloads directory
    const downloadsDir = path.join(os.homedir(), 'Downloads');
    const fileName = `near-credentials-${networkId}-${Date.now()}.md`;
    const filePath = path.join(downloadsDir, fileName);
    
    await fs.writeFile(filePath, markdownContent);
    
    // Open the file
    await open(filePath);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Credentials exported',
      message: `Exported ${accountFiles.length} accounts to ${fileName}`,
    });
  } catch (error) {
    console.error('Error exporting credentials:', error);
    await showToast({
      style: Toast.Style.Failure,
      title: 'Failed to export credentials',
      message: String(error),
    });
  }
}
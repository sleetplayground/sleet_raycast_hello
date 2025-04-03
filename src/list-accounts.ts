import { showToast, Toast, updateCommandPreferences } from "@raycast/api";
import { getAllAccounts } from "./utils/credentials";

export default async function Command() {
  try {
    const accounts = await getAllAccounts();

    if (accounts.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No NEAR accounts found",
        message: "Please login first using the login command",
      });
      return;
    }

    // Update the selectedAccount preference dropdown with found accounts
    const accountData = accounts.map((account) => ({
      title: account.label || account.account_id,
      value: account.account_id,
    }));

    // Add the "No Account" option at the start
    accountData.unshift({
      title: "No Account",
      value: "none",
    });

    // Update the preference data
    await updateCommandPreferences({
      selectedAccount: {
        data: accountData,
      },
    });

    await showToast({
      style: Toast.Style.Success,
      title: "Accounts updated",
      message: `Found ${accounts.length} NEAR accounts`,
    });
  } catch (error) {
    console.error("Error listing accounts:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to list accounts",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

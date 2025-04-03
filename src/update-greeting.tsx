import { useState, useEffect } from "react";
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { connect, keyStores, KeyPair, Contract } from "near-api-js";
import { getNetworkConfig } from "./utils/config";
import { getAvailableAccounts } from "./utils/credentials";

interface FormValues {
  network: string;
  account: string;
  greeting: string;
}

export default function UpdateGreeting() {
  const [accounts, setAccounts] = useState<{ value: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { networkId } = await getNetworkConfig();
    const availableAccounts = getAvailableAccounts(networkId);
    
    setAccounts(
      availableAccounts.map((acc) => ({
        value: acc.account_id,
        title: acc.account_id,
      }))
    );
    setIsLoading(false);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const { nodeUrl, networkId, contractName } = await getNetworkConfig();
      const availableAccounts = getAvailableAccounts(networkId);
      const accountCredentials = availableAccounts.find(
        (acc) => acc.account_id === values.account
      );

      if (!accountCredentials) {
        throw new Error("Account credentials not found");
      }

      const keyStore = new keyStores.InMemoryKeyStore();
      const keyPair = KeyPair.fromString(accountCredentials.private_key);
      await keyStore.setKey(networkId, values.account, keyPair);

      const near = await connect({ nodeUrl, networkId, keyStore });
      const account = await near.account(values.account);

      interface GreetingContract extends Contract {
        get_greeting(): Promise<string>;
        set_greeting(args: { greeting: string }): Promise<void>;
      }

      const contract = new Contract(
        account,
        contractName,
        {
          viewMethods: ["get_greeting"],
          changeMethods: ["set_greeting"],
          useLocalViewExecution: true
        }
      ) as GreetingContract;

      await contract.set_greeting({ greeting: values.greeting });

      await showToast({
        style: Toast.Style.Success,
        title: "Greeting Updated",
        message: `New greeting: ${values.greeting}`,
      });
    } catch (error) {
      console.error("Error updating greeting:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update greeting",
        primaryAction: {
          title: "Retry",
          onAction: () => handleSubmit(values)
        }
      });
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="account" title="Account">
        {accounts.map((account) => (
          <Form.Dropdown.Item
            key={account.value}
            value={account.value}
            title={account.title}
          />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="greeting"
        title="New Greeting"
        placeholder="Enter your new greeting"
      />
    </Form>
  );
}
import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { getNetworkConfig } from "./utils/config";
import { connect, Contract, utils } from "near-api-js";
import { getCredentials } from "./utils/credentials";

interface Web4Contract extends Contract {
  add_app(args: { app: Web4App }): Promise<void>;
  update_app(args: { app: Web4App }): Promise<void>;
}

interface Web4App {
  title: string;
  dapp_account_id: string;
  categories: string[];
  slug: string;
  oneliner: string;
  description: string;
  logo_url: string;
}

const CATEGORIES = [
  { value: "0", title: "Games" },
  { value: "1", title: "DeFi" },
  { value: "2", title: "Tools" },
  { value: "3", title: "Social" },
  { value: "4", title: "Other" },
];

const METHODS = [
  { value: "add_app", title: "Add New App" },
  { value: "update_app", title: "Update Existing App" },
];

export default function Command() {
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: Record<string, string>) {
    try {
      setIsSubmitting(true);
      const credentials = await getCredentials();
      if (!credentials) {
        showToast({
          style: Toast.Style.Failure,
          title: "No credentials found",
          message: "Please login with NEAR CLI first",
        });
        return;
      }

      const { nodeUrl, networkId } = await getNetworkConfig();
      const near = await connect({ nodeUrl, networkId });
      const contractAddress = networkId === "mainnet" ? "awesomeweb4.near" : "awesomeweb4.testnet";
      const account = await near.account(credentials.accountId);

      const contract = new Contract(
        account,
        contractAddress,
        {
          viewMethods: ["get_apps"],
          changeMethods: ["add_app", "update_app"],
        }
      ) as Web4Contract;

      const app: Web4App = {
        title: values.title,
        dapp_account_id: credentials.accountId,
        categories: [values.category],
        slug: values.slug,
        oneliner: values.oneliner,
        description: values.description,
        logo_url: values.logo_url,
      };

      const method = values.method === "add_app" ? "add_app" : "update_app";
      const deposit = utils.format.parseNearAmount("0.1");

      await contract[method](
        { app },
        "300000000000000", // gas
        deposit
      );

      showToast({
        style: Toast.Style.Success,
        title: "Success",
        message: `App ${method === "add_app" ? "added" : "updated"} successfully`,
      });

      pop();
    } catch (error) {
      console.error("Error submitting app:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to submit app",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="method" title="Method" defaultValue="add_app">
        {METHODS.map((method) => (
          <Form.Dropdown.Item
            key={method.value}
            value={method.value}
            title={method.title}
          />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="title"
        title="App Title"
        placeholder="Enter your app title"
        validation={{ required: true }}
      />

      <Form.TextField
        id="slug"
        title="App Slug"
        placeholder="Enter a unique identifier for your app"
        validation={{ required: true }}
      />

      <Form.Dropdown id="category" title="Category" defaultValue="4">
        {CATEGORIES.map((category) => (
          <Form.Dropdown.Item
            key={category.value}
            value={category.value}
            title={category.title}
          />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="oneliner"
        title="One-liner"
        placeholder="Brief description of your app"
        validation={{ required: true }}
      />

      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Detailed description of your app"
        validation={{ required: true }}
      />

      <Form.TextField
        id="logo_url"
        title="Logo URL"
        placeholder="URL to your app's logo"
        validation={{ required: true }}
      />

      <Form.Description
        title="Note"
        text="Submitting an app requires a deposit of 0.1 NEAR. The dapp_account_id will be automatically set to your logged-in account."
      />
    </Form>
  );
}
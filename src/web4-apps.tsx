import { Action, ActionPanel, List, Icon, showToast, Toast, Form, useNavigation, Detail, open } from "@raycast/api";
import { useState, useEffect } from "react";
import { getNetworkConfig } from "./utils/config";
import { connect, Contract } from "near-api-js";

interface Web4Contract extends Contract {
  get_apps(): Promise<Web4App[]>;
}

interface Web4App {
  active: boolean;
  title: string;
  description: string;
  dapp_account_id: string;
  oneliner: string;
  logo_url: string;
  slug: string;
}

interface DetailViewProps {
  app: Web4App;
}

function DetailView({ app }: DetailViewProps) {
  const web4Url = `${app.dapp_account_id}.page`;

  return (
    <Detail
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Title" text={app.title} />
          <Detail.Metadata.Label title="Account" text={app.dapp_account_id} />
          <Detail.Metadata.Label title="Web4 URL" text={web4Url} />
          {app.oneliner && <Detail.Metadata.Label title="Summary" text={app.oneliner} />}
          {app.description && <Detail.Metadata.Label title="Description" text={app.description} />}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={`https://${web4Url}`} />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [apps, setApps] = useState<Web4App[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      try {
        const { nodeUrl, networkId } = await getNetworkConfig();
        const near = await connect({ nodeUrl, networkId });
        const contractAddress = networkId === "mainnet" ? "awesomeweb4.near" : "awesomeweb4.testnet";
        const account = await near.account(contractAddress);
        const contract = new Contract(
          account,
          contractAddress,
          {
            viewMethods: ["get_apps"],
            changeMethods: [],
            useLocalViewExecution: true
          }
        ) as Web4Contract;

        const apps = await contract.get_apps();
        setApps(apps);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching apps:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch Web4 apps",
          message: error instanceof Error ? error.message : String(error),
        });
        setIsLoading(false);
      }
    }

    fetchApps();
  }, []);

  const filteredApps = apps.filter((app) => {
    const searchLower = searchText.toLowerCase();
    return (
      app.title.toLowerCase().includes(searchLower) ||
      app.dapp_account_id.toLowerCase().includes(searchLower) ||
      (app.description?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const handleOpenCustomDomain = () => {
    const accountId = searchText.trim();
    if (accountId) {
      const url = `https://${accountId}.page`;
      open(url);
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Web4 apps or enter NEAR account..."
      actions={
        <ActionPanel>
          <Action
            title="Open Custom Web4 Domain"
            icon={Icon.Globe}
            onAction={handleOpenCustomDomain}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
          />
        </ActionPanel>
      }
    >
      {filteredApps.map((app) => (
        <List.Item
          key={app.dapp_account_id}
          title={app.title}
          subtitle={app.dapp_account_id}
          accessories={[{ text: app.oneliner }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                target={<DetailView app={app} />}
                icon={Icon.Sidebar}
              />
              <Action.OpenInBrowser url={`https://${app.dapp_account_id}.page`} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
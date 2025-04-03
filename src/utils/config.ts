import { getPreferenceValues } from "@raycast/api";
import { getNetworkAccounts } from "./credentials";

interface Preferences {
  networkId: "mainnet" | "testnet";
  rpcEndpoint: "default" | "fastnear" | "custom";
  customRpcUrl?: string;
  contractName?: string;
  selectedAccount: string;
  data?: Array<{
    title: string;
    value: string;
    label: string;
  }>;
}

const RPC_ENDPOINTS = {
  mainnet: {
    default: "https://rpc.mainnet.near.org",
    fastnear: "https://free.rpc.fastnear.com",
  },
  testnet: {
    default: "https://rpc.testnet.near.org",
    fastnear: "https://test.rpc.fastnear.com",
  },
};

const DEFAULT_CONTRACTS = {
  mainnet: "hello.sleet.near",
  testnet: "hello.sleet.testnet",
};

export async function getNetworkConfig() {
  const preferences = getPreferenceValues<Preferences>();
  const { networkId, rpcEndpoint, customRpcUrl, contractName, selectedAccount } = preferences;

  // Determine RPC URL
  let nodeUrl = "";
  if (rpcEndpoint === "custom" && customRpcUrl) {
    nodeUrl = customRpcUrl;
  } else {
    nodeUrl = RPC_ENDPOINTS[networkId][rpcEndpoint as "default" | "fastnear"];
  }

  // Determine contract name
  const defaultContract = DEFAULT_CONTRACTS[networkId];
  const finalContractName = contractName || defaultContract;

  // Get available accounts for the selected network
  const accounts = await getNetworkAccounts(networkId);
  const accountOptions = accounts.map((acc) => ({
    title: acc.label || acc.account_id,
    value: acc.account_id,
    label: acc.label || acc.account_id,
  }));

  // Add the accounts to the preferences data
  if (accountOptions.length > 0) {
    preferences.data = [
      { title: "No Account", value: "none", label: "Use read-only mode (no login required)" },
      ...accountOptions,
    ];
  }

  return {
    networkId,
    nodeUrl,
    contractName: finalContractName,
    selectedAccount: selectedAccount === "none" ? null : selectedAccount,
    isReadOnly: selectedAccount === "none",
  };
}

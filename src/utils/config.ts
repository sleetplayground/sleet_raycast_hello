import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  networkId: "mainnet" | "testnet";
  rpcEndpoint: "default" | "fastnear" | "custom";
  customRpcUrl?: string;
  contractName?: string;
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

export function getNetworkConfig() {
  const preferences = getPreferenceValues<Preferences>();
  const { networkId, rpcEndpoint, customRpcUrl, contractName } = preferences;

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

  return {
    networkId,
    nodeUrl,
    contractName: finalContractName,
  };
}
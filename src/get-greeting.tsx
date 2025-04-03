import { showToast, Toast } from "@raycast/api";
import { connect, keyStores, Contract } from "near-api-js";
import { getNetworkConfig } from "./utils/config";
import type { FC } from "react";
import GreetingView from "./components/GreetingView";

interface GreetingContract extends Contract {
  get_greeting(): Promise<string>;
}

export default async function Command() {
  let greeting = "Failed to fetch greeting";
  let contractAddress = "Error";
  let networkId = "Error";

  try {
    const config = await getNetworkConfig();
    const keyStore = new keyStores.InMemoryKeyStore();
    const near = await connect({ ...config, keyStore });

    const contractId = config.contractName;
    const contract = new Contract(
      await near.account(""),
      contractId,
      {
        viewMethods: ["get_greeting"],
        changeMethods: [],
        useLocalViewExecution: true
      }
    ) as GreetingContract;

    greeting = await contract.get_greeting() || "No greeting set";
    contractAddress = contractId;
    networkId = config.networkId;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to fetch greeting",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <GreetingView
      greeting={greeting}
      contractAddress={contractAddress}
      networkId={networkId}
    />
  );
}
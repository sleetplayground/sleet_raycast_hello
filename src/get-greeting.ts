import { showToast, Toast } from "@raycast/api";
import { connect, keyStores, utils } from "near-api-js";
import { getConfig } from "./utils/config";
import GreetingView from "./components/GreetingView";

export default async function Command() {
  try {
    const config = getConfig();
    const keyStore = new keyStores.InMemoryKeyStore();
    const near = await connect({ ...config, keyStore });

    const contractId = config.networkId === "mainnet" ? "hello.sleet.near" : "hello.sleet.testnet";
    const contract = new utils.Contract(
      await near.account(""),
      contractId,
      {
        viewMethods: ["get_greeting"],
        changeMethods: [],
      }
    );

    const greeting = await contract.get_greeting();

    return (
      <GreetingView
        greeting={greeting}
        contractAddress={contractId}
        networkId={config.networkId}
      />
    );
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to fetch greeting",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
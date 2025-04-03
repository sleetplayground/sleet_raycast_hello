import React, { useState, useEffect } from "react";
import { ActionPanel, List, Action } from "@raycast/api";
import { getNetworkConfig } from "../utils/config";
import { connect, Contract } from "near-api-js";

interface GreetingProps {
  greeting: string;
  contractName: string;
  networkId: string;
}

const GetGreeting = () => {
  const [greeting, setGreeting] = useState<string>("");
  const [contractName, setContractName] = useState<string>("");
  const [networkId, setNetworkId] = useState<string>("");

  const refreshGreeting = async () => {
    const { nodeUrl, contractName, networkId } = await getNetworkConfig();
    setContractName(contractName);
    setNetworkId(networkId);

    const near = await connect({ nodeUrl, networkId });
    const account = await near.account();
    interface GreetingContract extends Contract {
      getGreeting(): Promise<string>;
    }
    const contract = new Contract(account, contractName, {
      viewMethods: ["getGreeting"],
      changeMethods: [],
      useLocalViewExecution: true
    }) as GreetingContract;

    const greeting = await contract.getGreeting();
    setGreeting(greeting);
  };

  useEffect(() => {
    refreshGreeting();
  }, []);

  return (
    <List>
      <List.Item
        title={`Greeting: ${greeting}`}
        subtitle={`Contract: ${contractName} | Network: ${networkId}`}
        actions={
          <ActionPanel>
            <Action title="Refresh Greeting" onAction={refreshGreeting} />
          </ActionPanel>
        }
      />
    </List>
  );
};

export default GetGreeting;

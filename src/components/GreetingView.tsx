import { Detail } from "@raycast/api";

interface GreetingViewProps {
  greeting: string;
  contractAddress: string;
  networkId: string;
}

export default function GreetingView({ greeting, contractAddress, networkId }: GreetingViewProps) {
  const markdown = `
# Current Greeting

${greeting}

## Contract Details
- **Contract Address**: ${contractAddress}
- **Network**: ${networkId}
  `;

  return <Detail markdown={markdown} />;
}
import { List, Icon, ActionPanel, Action } from "@raycast/api";


interface NearCommand {
  title: string;
  command: string;
  description: string;
  icon: Icon;
}

export default function Command() {
  const nearCommands: NearCommand[] = [
    {
      title: "Install NEAR CLI",
      command: "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh",
      description: "Install the NEAR CLI tool",
      icon: Icon.Download,
    },
    {
      title: "Check NEAR CLI Version",
      command: "near -V",
      description: "Display the installed NEAR CLI version",
      icon: Icon.Info,
    },
    {
      title: "NEAR Interactive Menu",
      command: "near",
      description: "Open the NEAR CLI interactive menu",
      icon: Icon.Terminal,
    },
    {
      title: "NEAR Login",
      command: "near login",
      description: "Login to your NEAR account",
      icon: Icon.Person,
    },
  ];

  return (
    <List>
      {nearCommands.map((item) => (
        <List.Item
          key={item.title}
          title={item.title}
          subtitle={item.description}
          icon={item.icon}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy CLI Command"
                content={item.command}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

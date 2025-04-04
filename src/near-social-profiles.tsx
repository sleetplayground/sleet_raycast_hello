import { ActionPanel, Action, Grid, List, Icon, showToast, Toast, Detail } from "@raycast/api";
import { useState, useEffect } from "react";
import { fetchNearSocialProfiles } from "./utils/near-social";

interface Profile {
  accountId: string;
  name?: string;
  image?: { ipfs_cid: string };
  description?: string;
  linktree?: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  tags?: Record<string, string>;
}

const IPFS_GATEWAY = "https://ipfs.near.social/ipfs/";

export default function Command() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchText, setSearchText] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const profileList = await fetchNearSocialProfiles();
      setProfiles(profileList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch profiles",
        message: errorMessage,
        primaryAction: {
          title: "Retry",
          onAction: fetchProfiles
        }
      });
      setLoading(false);
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchText.toLowerCase();
    return (
      profile.accountId.toLowerCase().includes(searchLower) ||
      profile.name?.toLowerCase().includes(searchLower) ||
      profile.description?.toLowerCase().includes(searchLower) ||
      Object.keys(profile.tags || {}).some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  function getProfileImage(profile: Profile) {
    return profile.image?.ipfs_cid ? `${IPFS_GATEWAY}${profile.image.ipfs_cid}` : Icon.Person;
  }

  function openLink(url: string) {
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }
    return () => open(url);
  }

  if (view === "grid") {
    return (
      <Grid
        itemSize={Grid.ItemSize.Medium}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        isLoading={loading}
        navigationTitle="NEAR Social Profiles"
        searchBarAccessory={
          <Grid.Dropdown
            tooltip="View Type"
            storeValue={true}
            onChange={(newValue) => setView(newValue as "grid" | "list")}
            value={view}
          >
            <Grid.Dropdown.Item title="Grid View" value="grid" />
            <Grid.Dropdown.Item title="List View" value="list" />
          </Grid.Dropdown>
        }
      >
        {filteredProfiles.map((profile) => (
          <Grid.Item
            key={profile.accountId}
            content={getProfileImage(profile)}
            title={profile.name || profile.accountId}
            subtitle={profile.description}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Profile"
                  target={<ProfileDetail profile={profile} />}
                />
                {profile.linktree?.website && (
                  <Action
                    title="Open Website"
                    onAction={openLink(profile.linktree.website)}
                    icon={Icon.Globe}
                  />
                )}
                {profile.linktree?.github && (
                  <Action
                    title="Open GitHub"
                    onAction={openLink(profile.linktree.github)}
                    icon={Icon.Code}
                  />
                )}
                {profile.linktree?.twitter && (
                  <Action
                    title="Open Twitter"
                    onAction={openLink(profile.linktree.twitter)}
                    icon={Icon.Link}
                  />
                )}
              </ActionPanel>
            }
          />
        ))}
      </Grid>
    );
  }

  return (
    <List
      searchText={searchText}
      onSearchTextChange={setSearchText}
      isLoading={loading}
      navigationTitle="NEAR Social Profiles"
      searchBarAccessory={
        <List.Dropdown
          tooltip="View Type"
          storeValue={true}
          onChange={(newValue) => setView(newValue as "grid" | "list")}
          value={view}
        >
          <List.Dropdown.Item title="Grid View" value="grid" />
          <List.Dropdown.Item title="List View" value="list" />
        </List.Dropdown>
      }
    >
      {filteredProfiles.map((profile) => (
        <List.Item
          key={profile.accountId}
          icon={getProfileImage(profile)}
          title={profile.name || profile.accountId}
          subtitle={profile.description}
          accessories={[
            { text: Object.keys(profile.tags || {}).join(", ") },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Profile"
                target={<ProfileDetail profile={profile} />}
              />
              {profile.linktree?.website && (
                <Action
                  title="Open Website"
                  onAction={openLink(profile.linktree.website)}
                  icon={Icon.Globe}
                />
              )}
              {profile.linktree?.github && (
                <Action
                  title="Open GitHub"
                  onAction={openLink(profile.linktree.github)}
                  icon={Icon.Code}
                />
              )}
              {profile.linktree?.twitter && (
                <Action
                  title="Open Twitter"
                  onAction={openLink(profile.linktree.twitter)}
                  icon={Icon.Link}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function ProfileDetail({ profile }: { profile: Profile }) {
  const markdown = `
# ${profile.name || profile.accountId}

${profile.description || ""}

## Links
${profile.linktree?.website ? `- [Website](${profile.linktree.website})\n` : ""}
${profile.linktree?.github ? `- [GitHub](${profile.linktree.github})\n` : ""}
${profile.linktree?.twitter ? `- [Twitter](${profile.linktree.twitter})\n` : ""}

## Tags
${Object.keys(profile.tags || {}).map((tag) => `- ${tag}`).join("\n")}
`;

  return <Detail markdown={markdown} />
}
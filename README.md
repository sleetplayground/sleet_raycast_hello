# Sleet Hello

A hello extension by Sleet for interacting with the near blockchain.

> this app uses near api js, but makes use of near cli credidentials for signing trasactions
> i also called this a hello extention for a lack of a better name, but it has a lot of commands and examples of what is possible to do with near api js and near blockchain.

---

### dev

```sh
pnpm install

pnpm dev
pnpm lint

# build && publish
pnpm build
pnpm publish
```

---

### what can you do with this extension
check mark for if they are implemented!

hello.sleet
- [x] get the greeting from hello.sleet.near/.testnet on mainnet and testnet
- [X] update the greeting
- [ ] create new near account, a *.user.raycast.near
- [ ] create a meme token on meme cooking
- [ ] linktree
- [ ] colorsnake

web4, awesomeweb4
- [ ] discover and open web4 sites in browser
- [ ] submit web4 app


near cli commands
- [x] install near cli "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh"
- [x] near -V
- [x] near - brings up interactive menu in cli
- [x] near login, make sure to save account credidentals to legacy so you can use them in this app
- [x] near account import-account using-private-key
- [x] near account export-account $ACCOUNT_ID
- [x] near list-keys $ACCOUNT_ID
- [x] near config show-connections



---

copyright: 2025 by sleet.near
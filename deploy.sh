#! /bin/bash

network=bnb_testnet

# npx hardhat --network $network run scripts/deploy_yushaku.ts
pnpm hardhat --network $network run ./scripts/deployNFT.ts

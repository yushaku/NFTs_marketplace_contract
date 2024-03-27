#! /bin/bash

network=bnb_testnet

pnpm hardhat --network $network run ./scripts/deploy_yushaku.ts
# pnpm hardhat --network $network run ./scripts/deployNFT.ts

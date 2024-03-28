#! /bin/bash

network=bnb_testnet

pnpm hardhat --network $network run ./scripts/0.deploy_token.ts
# pnpm hardhat --network $network run ./scripts/1.deploy_Governance.ts

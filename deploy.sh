#! /bin/bash

network=bnb_testnet

if [ "$1" == "0" ]; then
	pnpm hardhat --network $network run ./scripts/0.deploy_token.ts
fi

if [ "$1" == "1" ]; then
	pnpm hardhat --network $network run ./scripts/1.deploy_Governance.ts
fi

if [ "$1" == "2" ]; then
	pnpm hardhat --network $network run ./scripts/2.deploy_stake.ts
fi

if [ "$1" == "3" ]; then
	pnpm hardhat --network $network run ./scripts/3.deploy_NFTs.ts
fi

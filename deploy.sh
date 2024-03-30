#! /bin/bash

network=mumbai

if [ "$1" == "0" ]; then
	pnpm hardhat --network $network run ./scripts/0.deploy_token.ts
fi

if [ "$1" == "1" ]; then
	pnpm hardhat --network $network run ./scripts/1.deploy_Governance.ts
fi

if [ "$1" == "2" ]; then
	pnpm hardhat --network $network run ./scripts/2.deploy_stake.ts
fi

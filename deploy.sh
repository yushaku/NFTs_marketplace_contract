#! /bin/bash

function deploy() {
	# npx hardhat --network sepolia run scripts/deploy_yushaku.ts
	# npx hardhat --network arbitrum run scripts/deploy_yushaku.ts
	npx hardhat --network nautilus run scripts/deploy_yushaku.ts
}

deploy

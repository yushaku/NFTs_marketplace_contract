#! /bin/bash

function deploy() {
	# npx hardhat --network sepolia run scripts/deploy_yushaku.ts
	# npx hardhat --network arbitrum run scripts/deploy_yushaku.ts
	# npx hardhat --network nautilus run scripts/deploy_yushaku.ts
	# npx hardhat --network arbitrum run scripts/deploy_yushaku.ts
	# npx hardhat --network arbitrum_goerli run scripts/deploy_yushaku.ts
	npx hardhat --network bnb_testnet run scripts/deploy_yushaku.ts
	# npx hardhat --network bnb run scripts/deploy_yushaku.ts
}

deploy

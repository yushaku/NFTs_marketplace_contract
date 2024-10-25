#! /bin/bash

network=bnb_testnet

if [[ -z "$1" ]]; then
  OPTIONS=("governor" "shopPayment" "NFTs")
  SELECTION=$(printf "%s\n" "${OPTIONS[@]}" | fzf --multi --prompt="Select options: ")
else
  SELECTION=$1
fi

if [[ -z "$SELECTION" ]]; then
  echo "No option selected. Please pick one of the following:"
  echo "${OPTIONS[*]}"
  exit 0
fi

if [ "$SELECTION" == "shopPayment" ]; then
  pnpm hardhat --network $network run ./scripts/2.deploy_shopPayment.ts
fi

if [ "$SELECTION" == "NFTs" ]; then
  pnpm hardhat --network $network run ./scripts/3.deploy_NFTs.ts
fi

if [ "$SELECTION" == "governor" ]; then
  pnpm hardhat --network $network run ./scripts/3.governor.ts
fi

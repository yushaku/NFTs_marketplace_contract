import fs from "fs";

const ipfs =
  "ipfs://bafybeigjo7vswkssnmoii6e5rif6srbc7xyqmdvxxlyo37zokst4dnmlka/";

const metadataTemple = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Strength",
      value: 0,
    },
    {
      trait_type: "Dexterity",
      value: 0,
    },
    {
      trait_type: "Constitution",
      value: 0,
    },
    {
      trait_type: "Intelligence",
      value: 0,
    },
    {
      trait_type: "Wisdom",
      value: 0,
    },
    {
      trait_type: "Charisma",
      value: 0,
    },
    {
      trait_type: "Experience",
      value: 0,
    },
  ],
};

let index = 0;
while (index < 21) {
  index++;

  let characterMetadata = metadataTemple;

  // if (fs.existsSync(`metadata/${index}`)) {
  //   console.log("ok");
  //   continue;
  // }

  const random = () => Math.floor(Math.random() * 100) + 1;
  characterMetadata["name"] = `gundam-${index}`;
  characterMetadata["image"] = `${ipfs}/gun${index}.mp4`;
  characterMetadata[
    "description"
  ] = `Brilliant spell-slinger and magical with cryptography. Often uses Jewles in her h-index potions. `;
  characterMetadata["attributes"][0]["value"] = random();
  characterMetadata["attributes"][1]["value"] = random();
  characterMetadata["attributes"][2]["value"] = random();
  characterMetadata["attributes"][3]["value"] = random();
  characterMetadata["attributes"][4]["value"] = random();
  characterMetadata["attributes"][5]["value"] = random();

  let data = JSON.stringify(characterMetadata);
  fs.writeFileSync(`./metadata/${index}`, data);
}

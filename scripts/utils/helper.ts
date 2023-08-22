import fs from "fs";

export const writeDownAddress = async (key: string, address: string) => {
  console.log(`${key}: ${address}`);

  const rawData = fs.readFileSync("./address.json");
  const object = JSON.parse(rawData.toString());
  object[key] = address;
  fs.writeFileSync("./address.json", JSON.stringify(object, null, 2));
};

export const getAddress = async (key: string) => {
  const rawData = fs.readFileSync("./address.json");
  const object = JSON.parse(rawData.toString());
  return object[key];
};

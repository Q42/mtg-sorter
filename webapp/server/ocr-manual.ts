import { whatCardIsInFrontOfTheCamera } from "./ocr";

async function main() {
  await whatCardIsInFrontOfTheCamera();
}

main().then(() => console.log("Done!"));

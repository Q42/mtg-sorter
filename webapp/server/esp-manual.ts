import { ESP } from "./esp";

async function main() {
  const esp = new ESP();

  setInterval(() => {
    esp.send("1");
    setTimeout(() => {
      esp.send("2");
    }, 1500);
  }, 3000);
}

main().then(() => console.log("Done!"));

import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { EventEmitter } from "events";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import ollama from "ollama";
import * as Scry from "scryfall-sdk";

export class ROBOT {
  private port: SerialPort;
  private parser: ReadlineParser & EventEmitter;

  // Constants for positions
  private readonly LIFT_POSITION = -150;
  private readonly DROP_POSITION = 0;
  private readonly SHAKE_OFFSET = -5;

  constructor(portPath: string = "/dev/tty.usbserial-57990087871") {
    this.port = new SerialPort({
      path: portPath,
      baudRate: 115200,
    }) as SerialPort & EventEmitter;

    this.parser = new ReadlineParser({ delimiter: "\n" }) as ReadlineParser & EventEmitter;
    (this.port as any).pipe(this.parser);

    this.port.on("open", () => {
      console.log("[ROBOT] Connected");
    });

    this.parser.on("data", (data: string) => {
      // if (data.length > 1) {
      //   console.log("[ROBOT] Received:", data);
      // }
    });
  }

  private async sendCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.write(command + "\r\n", (err) => {
        if (err) {
          console.log("[ROBOT] Error on write:", err.message);
          reject(err);
        } else {
          console.log("[ROBOT] Sent:", command);
          resolve();
        }
      });
    });
  }

  // Arm control commands
  async setArmPosition(position: number): Promise<void> {
    await this.sendCommand(`arm ${position}`);
  }

  async liftArm(): Promise<void> {
    await this.setArmPosition(this.LIFT_POSITION);    
  }

  async dropArm(): Promise<void> {
    await this.setArmPosition(this.DROP_POSITION);
  }

  // Vacuum control
  async setVacuum(on: boolean): Promise<void> {
    await this.sendCommand(`vac ${on ? 1 : 0}`);
  }

  // Plate rotation
  async rotatePlate(degrees: number): Promise<void> {
    await this.sendCommand(`plate ${degrees}`);
  }

  // Home position
  async home(): Promise<void> {
    await this.sendCommand("home");
  }

  // Emergency stop
  async pause(): Promise<void> {
    await this.sendCommand("pause");
  }

  // Light control
  async setLight(on: boolean): Promise<void> {
    await this.sendCommand(`lamp ${on ? 1 : 0}`);
  }

  // Complex movements
  async shake(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await this.setArmPosition(this.LIFT_POSITION + this.SHAKE_OFFSET);
      await new Promise(r => setTimeout(r, 500));
      await this.setArmPosition(this.LIFT_POSITION);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  async pickupCard(): Promise<void> {
    await this.dropArm();
    await new Promise(r => setTimeout(r, 1500));
    await this.setVacuum(true);
    await new Promise(r => setTimeout(r, 1500));
    await this.setArmPosition(this.LIFT_POSITION / 2);
    await new Promise(r => setTimeout(r, 4500));
    await this.shake();
    await this.liftArm();
    await this.pause();
  }

  async dropCard(): Promise<void> {
    await new Promise(r => setTimeout(r, 100));
    await this.dropArm();
    await new Promise(r => setTimeout(r, 3000));
    await this.setVacuum(false);
    await new Promise(r => setTimeout(r, 1000));
    await this.liftArm();
    await new Promise(r => setTimeout(r, 3000));
    await this.pause();
  }

  async turnToPile(pileIndex: number): Promise<void> {
    const degrees = Math.round(pileIndex * 191.5);
    await this.rotatePlate(degrees);
    await new Promise(r => setTimeout(r, 4000));
  }

  async turnToColorPile(color: string): Promise<void> {
    const pileMap: Record<string, number> = {
      'R': 4,
      'G': 1,
      'U': 2,
      'W': 3,
      'B': 5,
      'other': 6
    };
    
    const pileIndex = pileMap[color] || 6;
    await this.turnToPile(pileIndex);
  }

  async powerOff(): Promise<void> {
    await robot.setLight(false);
    await robot.pause();
    await robot.setVacuum(false);
  }

  async whatCardIsInFrontOfTheCamera(): Promise<string> {
    console.log("Getting image from camera");
    const body = (
      await axios({
        url: `http://192.168.178.61/capture`,
        responseType: "arraybuffer",
      })
    ).data;
    if (!body) {
      throw new Error("No body in response");
    }
  
    const file = sharp(body as Buffer);
    file.rotate(6);
    file.extract({
      left: 585,
      top: 300,
      width: 400,
      height: 400
    });

    // test data
    await file.toFile("./tmp/temp.jpg");
    const fullPath = process.cwd() + "/tmp/temp.jpg";
    console.log("Image gotten from camera and saved to fullPath " + fullPath);
  
    const response = await ollama.chat({
      // model: "llava:13b",
      model: "minicpm-v",
      // model: "moondream", // doesnt understand formating, fast and ocr better
      options: {
        temperature: 0.0,
        // top_p: 1.0,
        // top_k: 1,
        // repeat_penalty: 1.0
      },
      think: false,
      messages: [
        {
          role: "system",
          content: fs.readFileSync("./promptv3.txt", "utf8"),          
        },
        {
          role: "user",
          content: "",
          images: [fullPath],
        },
      ],
    });

    // console.log(response.message.content);
    // const json = JSON.parse(response.message.content.replace(/```json\n|```/g, ''));
    return response.message.content;
  }
}

// Create a singleton instance
export const robot = new ROBOT();

async function processCommand(command: string): Promise<void> {
  const [cmd, ...args] = command.trim().split(' ');
  
  switch (cmd.toLowerCase()) {
    case 'home':
      await robot.home();
      break;
    case 'ready':
      await robot.setVacuum(false);
      await robot.setArmPosition(-140);
      break;
    case 'lift':
      await robot.liftArm();
      break;
    case 'drop':
      await robot.dropArm();
      break;
    case 'vacuum':
      await robot.setVacuum(args[0] === 'on');
      break;
    case 'rotate':
      await robot.rotatePlate(parseInt(args[0]));
      break;
    case 'light':
      await robot.setLight(args[0] === 'on');
      break;
    case 'shake':
      await robot.shake();
      break;
    case 'pickup':
      await robot.pickupCard();
      break;
    case 'dropcard':
      await robot.dropCard();
      break;
    case 'pile':
      await robot.turnToPile(parseInt(args[0]));
      break;
    case 'color':
      await robot.turnToColorPile(args[0]);
      break;
    case 'pause':
      await robot.pause();
      break;
    case 'start':
      await sortCards();
      break;
    case 'whatcard':
      const name = await robot.whatCardIsInFrontOfTheCamera();
      console.log("Card name:", name);
      
      break;
    case 'help':
      console.log(`
Available commands:
  home              - Move to home position
  lift              - Lift the arm
  drop              - Drop the arm
  vacuum on/off     - Control vacuum
  rotate <degrees>  - Rotate plate
  light on/off      - Control light
  shake             - Shake the arm
  pickup            - Pick up a card
  dropcard          - Drop a card
  pile <index>      - Turn to pile (0-5)
  color <color>     - Turn to color pile (R,G,U,W,B)
  pause             - Emergency stop
  ready             - Ready the robot
  help              - Show this help
  exit              - Exit program
      `);
      break;
    case 'exit':
      await robot.powerOff();
      process.exit(0);
      break;
    default:
      console.log('Unknown command. Type "help" for available commands.');
  }

  async function sortCards() {
    await robot.liftArm();
    await new Promise(r => setTimeout(r, 2000));
    
    const name = await robot.whatCardIsInFrontOfTheCamera();
    console.log("Card name:", name);

    const cards = await Scry.Cards.search(name).waitForAll();
    if (cards.length === 0) {
      console.warn("Unable to find cardd", name);
      await robot.pickupCard();
      await robot.turnToPile(7);
      await robot.dropCard();
      await robot.turnToPile(0);
      await sortCards();
      return;
    }
    const card = cards[0];
    const rarity = card.rarity;
    const eurPrice = card.prices.eur;
    console.log("Found Card:", card.name, "Rarity:", rarity, "EUR Price:", eurPrice);

    await robot.pickupCard();
    // Log card details to CSV
    const fs = require('fs');
    const csvLine = `${new Date().toISOString()},${card.name},${rarity},${eurPrice},${rarity === "uncommon" ? 0 : rarity === "common" ? 1 : rarity === "rare" ? 2 : 3},${JSON.stringify(card)}\n`;
    
    // Create CSV with headers if it doesn't exist
    if (!fs.existsSync('sorted_cards.csv')) {
      fs.writeFileSync('sorted_cards.csv', 'timestamp,name,rarity,price_eur,pile,card_data\n');
    }
    
    fs.appendFileSync('sorted_cards.csv', csvLine);

    if (rarity === "common") {
      await robot.turnToPile(1);
    } else if (rarity === "uncommon") {
      await robot.turnToPile(2);
    } else if (rarity === "rare") {
      await robot.turnToPile(3);
    } else if (rarity === "mythic") {
      await robot.turnToPile(4);
    }

    await robot.dropCard();   
    await robot.turnToPile(0); 
    await sortCards();
  }
}

async function main() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await robot.powerOff();
    process.exit(0);
  });

  console.log('Robot Control Interface');
  console.log('Type "help" for available commands');
  // await new Promise(r => setTimeout(r, 3000));
  
  await robot.home();
  await robot.pause();
  await robot.setLight(true);

  console.log('Robot ready, put in starting position');
  
  const prompt = () => {
    readline.question('robot> ', async (command: string) => {
      try {
        await processCommand(command);
      } catch (error) {
        console.error('Error:', error);
      }
      prompt();
    });
  };

  prompt();
}

main().catch(console.error);

console.log('exiting')
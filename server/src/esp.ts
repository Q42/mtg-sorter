import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

export class ESP {
  private port: SerialPort;

  constructor() {
    this.port = new SerialPort({
      path: "/dev/tty.usbserial-57990095321",
      baudRate: 115200,
    });
    const parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));
    this.port.on("open", () => {
      console.log("[ARDUINO] connected");
    });
    parser.on("data", (data: any) => {
      console.log("[ARDUINO] Received", data);
    });
  }

  send(msg: string) {
    return new Promise((resolve, reject) => {
      this.port.write(msg, (err) => {
        if (err) {
          console.log("[ARDUINO] Error on write: ", err.message);
          reject(err);
        } else {
          console.log("[ARDUINO] Wrote: " + msg);
          resolve(msg);
        }
      });
    });
  }
}

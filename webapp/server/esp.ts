import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

export class ESP {
  port;

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
    this.port.write(msg, (err) => {
      if (err) {
        return console.log("[ARDUINO] Error on write: ", err.message);
      }
      console.log("[ARDUINO] Wrote: " + msg);
    });
  }
}

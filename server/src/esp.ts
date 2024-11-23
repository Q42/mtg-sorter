import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

export class ESP {
  private port: SerialPort;

  constructor() {
    this.port = new SerialPort({
      path: "/dev/cu.usbserial-57990087871", //"/dev/tty.usbserial-57990095321",
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

  send(msg: { msg: string }) {
    // console.log("writing", msg);
    return new Promise((resolve, reject) => {
      // const buffer = Buffer.from(msg, "utf8");
      // console.log("sending", buffer);
      this.port.write(msg.msg + "\r\n", (err) => {
        if (err) {
          console.log("[ARDUINO] Error on write: ", err.message);
          reject(err);
        } else {
          console.log("[ARDUINO] Wrote: " + msg.msg);
          resolve(msg);
        }
      });
    });
  }
}

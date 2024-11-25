import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import { ESP } from "./esp";

export default class Server {
  esp: ESP | undefined;

  constructor(app: Application) {
    this.config(app);

    this.esp = new ESP();

    app.post("/", async (req, res) => {
      console.log("Sending", req.body.msg);
      if (this.esp) {
        await this.esp.send(req.body);
      }
      res.json({
        status: "ok",
        message: req.body.msg,
        sentToDevice: !!this.esp,
      });
    });
  }

  private config(app: Application): void {
    const corsOptions: CorsOptions = {
      origin: "http://localhost:8081",
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }
}

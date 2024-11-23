import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import { ESP } from "./esp";

const esp = new ESP();

export default class Server {
  constructor(app: Application) {
    this.config(app);

    app.get("/:msg", async (req, res) => {
      // await esp.send(req.params.msg);
      res.json({ status: "ok", message: req.params.msg });
    });

    app.post("/", async (req, res) => {
      console.log("Sending", req.body.msg);
      await esp.send(req.body);
      res.json({ status: "ok", message: req.body.msg });
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

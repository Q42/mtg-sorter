import axios from "axios";

export class ESP {
  constructor() {}

  async send(msg: string) {
    await axios.get(`http://localhost:8080/${msg}`);
  }
}

import axios from "axios";

export class ESP {
  constructor() {}

  async send(msg: string) {
    await axios.post(`http://localhost:8080/`, { msg });
  }
}

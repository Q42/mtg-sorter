import { VertexAI } from "@google-cloud/vertexai";
import axios from "axios";
import sharp from "sharp";

export async function whatCardIsInFrontOfTheCamera(ip: string = "10.71.16.46") {
  const body = (
    await axios({
      url: `http://${ip}/capture`,
      responseType: "arraybuffer",
    })
  ).data;
  if (!body) {
    throw new Error("No body in response");
  }

  const file = sharp(body as Buffer);
  const data1 = file.resize(800);

  // test data
  await data1.toFile("./server/data/temp.jpg");
  console.log("Image gotten from camera and saved to ./server/data/temp.jpg");

  const name = await ocrImage((await data1.toBuffer()).toString("base64"));
  return name;
}

async function ocrImage(fileBase64: string) {
  const vertex_ai = new VertexAI({
    project: "q42puzzles-wordlists",
    location: "europe-west1",
  });
  const model = "gemini-1.5-flash";

  // Instantiate the models
  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 1959,
      temperature: 1,
      topP: 1,
    },
  });
  const filePart = {
    inline_data: { data: fileBase64, mimeType: "image/jpeg" },
  };
  const textPart = {
    text: `What MtG card is this? Return just the name, without intro or header info.
    If there is no card, return nothing.`,
  };
  const req = {
    contents: [{ role: "user", parts: [textPart, filePart] }],
  };
  const response = await generativeModel.generateContent(req as any);
  const text = response.response.candidates?.[0].content.parts?.[0].text ?? "";

  function getstring(input: string) {
    return input
      .split("\n")[0]
      .replace(/^[." \\]+/, "")
      .replace(/[." \\]+$/, "");
  }

  const name = getstring(text.split(", ")[0]);

  return name;
}

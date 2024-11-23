import {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";

export async function whatCardIsInFrontOfTheCamera(ip: string = "10.71.16.11") {
  const body = (
    await axios({
      url: `http://${ip}/capture`,
      responseType: "arraybuffer",
    })
  ).data;
  if (!body) {
    throw new Error("No body in response");
  }

  console.log("hallo?");

  const file = sharp(body as Buffer);
  const data1 = file.rotate(180);

  // test data
  await data1.toFile("./server/data/temp.jpg");
  console.log("Image gotten from camera and saved to ./server/data/temp.jpg");

  const name = await ocrImage((await data1.toBuffer()).toString("base64"));
  console.log("OCR result:", name);
  return name;
}

async function ocrImage(fileBase64: string) {
  const vertex_ai = new VertexAI({
    project: "q42puzzles-wordlists",
    location: "europe-west1",
  });
  const model = "gemini-1.5-flash-002";

  // Instantiate the models
  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 1959,
      temperature: 1,
      topP: 1,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
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
  console.log(JSON.stringify(response, null, 2));
  fs.writeFileSync(
    "./server/data/response.json",
    JSON.stringify(response, null, 2)
  );
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

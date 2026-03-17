import { commit } from "@huggingface/hub";
import fs         from "fs";

const HF_TOKEN          = process.env.HF_TOKEN;
const HF_DATASET_REPO   = process.env.HF_DATASET_REPO;

const uploadCSVToHuggingFace = async () => {
  try {
    const fileBuffer    = fs.readFileSync("./training_dataset.csv");

    const now           = new Date();
    const formattedTime = now.toISOString(); 

    await commit({
      repo: HF_DATASET_REPO,

      operations: [
        {
          operation:  "addOrUpdate",
          path:       "training_dataset.csv",
          content: new Blob([fileBuffer]),// Node.js uses Blob from file buffer directly 
        }
      ],

      title:       "update training dataset", // This library uses 'title' instead of 'summary'
      description: `auto upload csv from backend at ${formattedTime}`,

      credentials: {
        accessToken: HF_TOKEN
      }
    });

    console.log("Upload dataset success");
  } catch (error) {
    console.error("Upload failed:", error.message);
  }
};

export default uploadCSVToHuggingFace;
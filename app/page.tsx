import { LMStudioClient } from "@lmstudio/sdk";
const client = new LMStudioClient();

const model = await client.llm.model("oh-dcft-v3.1-claude-3-5-sonnet-20241022");
const result = await model.respond("Quien es Cristiano ronaldo?");


export default function Home() {
  return (
    <div>
      {result.content}
    </div>
  );
}

import { openai } from "./consts.ts";
import chalk from "chalk";
import inquirer from "inquirer";

export async function generateResponse(
  prompt: string,
  systemPrompt: string = "You are a helpful assistant."
) {
  const response = await openai.chat.completions.create({
    model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true
  });

  return response;
}

export async function startTUI() {
  console.log(chalk.blue("================================="));
  console.log(chalk.blue("          LLM TUI Tool           "));
  console.log(chalk.blue("================================="));
  console.log(chalk.green("Please input your prompt:"));
  console.log(chalk.green("type exit to quit"));
  while (true) {
    const { prompt } = await inquirer.prompt({
      type: "input",
      name: "prompt",
      message: chalk.yellow("You: "),
    });
    if (prompt.toLowerCase() === "exit") {
      break;
    }
    const response = await generateResponse(prompt);
    let content = "";
    for await (const chunk of response) {
      content += chunk.choices[0].delta.content || "";
      process.stdout.write(`generating: ${content} \n`);
      if (chunk.choices[0].finish_reason === "stop") {
        process.stdout.write(`AI: ${content}\n`);
      }
    }
  }
}

startTUI();

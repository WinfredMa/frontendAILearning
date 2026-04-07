import { openai } from "./consts.ts";
import chalk from "chalk";
import inquirer from "inquirer";

export async function generateResponse(
  prompt: any[],
) {
  const response = await openai.chat.completions.create({
    model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
    messages: prompt,
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
  const history: any[] = [];
  while (true) {
    const { prompt } = await inquirer.prompt({
      type: "input",
      name: "prompt",
      message: chalk.yellow("You: "),
    });
    if (prompt.toLowerCase() === "exit") {
      break;
    }
    history.push({ role: "user", content: prompt });

    const response = await generateResponse(history);
    let assistantResponse = '';
    for await (const chunk of response) {
      let content = chunk.choices[0].delta.content || "";
      if (content) {
        process.stdout.write(content);
        assistantResponse += content;
      }
    }
    history.push({ role: "assistant", content: assistantResponse });
  }
}

startTUI();

import OpenAI from "openai";
import { openai } from "./consts.ts";
import chalk from "chalk";
import inquirer from "inquirer";

const tools: OpenAI.Chat.ChatCompletionTool[] = [{
    type: 'function' as const,
    function: {
      name: 'create_test_folder',
      description: 'Create a test folder in current directory',
      parameters: {
        type: 'object',
        properties: {
          folderName: {
            type: 'string',
            description: 'The name of folder to create'
          }
        },
        required: ['folderName']
      }
    }
  }];

const MODEL_NAME = 
  process.env.SILICON_FLOW_MODEL ?? "Qwen/Qwen2.5-7B-Instruct";

export const generateResponseWithTools = async (question: any[], systemPrompt: any[]) => {
  const response = await openai.chat.completions.create({
    model: MODEL_NAME,
    messages: [...systemPrompt, ...question],
    tools: tools,
    tool_choice: 'auto'
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
  
      try {
        const response = await generateResponseWithTools(history, [{ role: "system", content: "must create a test folder whatever the user inputs \n" }]);
        debugger
        const assistantMessage = response.choices[0]?.message;
        if (assistantMessage?.content) {
          console.log(chalk.cyan(`AI: ${assistantMessage.content}`));
          history.push({ role: "assistant", content: assistantMessage.content });
        } else {
          console.log(chalk.cyan("AI requested a tool call (no text output)."));
          history.push({ role: "assistant", content: "" });
        }
      } catch (error) {
        if (error instanceof OpenAI.APIError) {
          console.error(chalk.red(`API Error ${error.status ?? ""}: ${error.message}`));
          if (error.request_id) {
            console.error(chalk.red(`Request ID: ${error.request_id}`));
          }
          if (error.error) {
            console.error(chalk.red(`Details: ${JSON.stringify(error.error)}`));
          }
        } else {
          console.error(chalk.red("Unexpected error:"), error);
        }
      }
    }
  }
  
  startTUI();
  
  export const functionRunner = async (functionInfo: string) => {
    
  
  }
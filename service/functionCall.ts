import OpenAI from "openai";
import { openai } from "./consts.ts";
import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import fs from "fs";      


const tools: OpenAI.Chat.ChatCompletionTool[] = [{
    type: 'function' as const,
    function: {
      name: 'create_folder',
      description: 'Create a folder in current directory',
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
    tool_choice: 'auto',
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
  
      try {
        const response = await generateResponseWithTools(history, [{ role: "system", content: "must create a folder whatever the user inputs \n" }]);
        let toolCalls: any[] = [];
        let content = '';
        
        for await (const chunk of response) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const existingCall = toolCalls.find(tc => tc.index === toolCall.index);
              if (existingCall) {
                if (toolCall.function?.arguments) {
                  existingCall.function.arguments += toolCall.function.arguments;
                }
              } else {
                toolCalls.push(toolCall);
              }
            }
          }
          if (delta?.content) {
            process.stdout.write(delta.content);
            content += delta.content;
          }
        }
        
        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            console.log(chalk.magenta(`Calling function: ${functionName}`));
            console.log(chalk.magenta(`Function arguments: ${JSON.stringify(functionArgs)}`));
            
            const result = await functionRunner(functionName, functionArgs);
            
            if (result.success) {
              console.log(chalk.green(result.message));
            } else {
              console.log(chalk.red(result.message));
            }
          }
        }
      } catch (error) {
        if (error instanceof OpenAI.APIError) {
          console.error(chalk.red(`API Error ${error.status ?? ""}: ${error.message}`));
          if (error.requestID) {
            console.error(chalk.red(`Request ID: ${error.requestID}`));
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
  
  export const functionRunner = async (functionName: string, functionArgs: any) =>{
    if (functionName === 'create_folder') {
      const folderName = functionArgs.folderName || 'test';
      const currentDir = process.cwd();
      const folderPath = path.join(currentDir, folderName);

      try {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
          return { success: true, message: `Folder "${folderName}" created successfully at ${folderPath}` };
        } else {
          return { success: false, message: `Folder "${folderName}" already exists at ${folderPath}` };
        }
      } catch (error) {
        return { success: false, message: `Error creating folder: ${error}` };
      }
    }
  
    return { success: false, message: `Unknown function: ${functionName}` };
  }
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOOLS: any = [
  {
    name: "generate_mock",
    description: "generate mock data base on IDL",
    inputSchema: {
      type: "object",
      properties: {
        urlPath: {
          type: "string",
          description:
            "API Path used to select the corresponding IDL file (such as /api/user, /api/product, /api/order)",
        },
        interfaceName: {
          type: "string",
          description: "interface name",
        },
        count: {
          type: "number",
          description: "count",
        },
      },
      required: ["urlPath", "interfaceName", "count"],
    },
  },
];

export const generateServer = () => {
  const server = new Server(
    {
      name: "mock-generateServer",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'generate_mock') {
        const { urlPath, interfaceName, count = 1 } = args as any;
        const filePath = path.join(__dirname, 'order.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const idl = JSON.parse(fileContent);
        const responseText = JSON.stringify({
          urlPath,
          interfaceName,
          count,
          idl: idl,
          message: `please generate ${count} mock data base on idl. interface: ${interfaceName}`,
        }, null, 2);

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${String(name)}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      const detail =
        error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
      return {
        content: [{ type: "text", text: `generate_mock failed: ${detail}` }],
        isError: true,
      };
    }
  })

  const transport = new StdioServerTransport();
  server.connect(transport);

  return server;
};

generateServer();

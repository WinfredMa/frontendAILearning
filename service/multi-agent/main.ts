import path from 'path';
import { createMasterAgent } from './master-agent/index.ts';
import { fileURLToPath } from 'url';

async function main() {
  // 使用当前文件所在目录作为agent目录
   const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const agentDir = path.resolve(__dirname, 'master-agent');
  const masterAgent = createMasterAgent(agentDir);
  await masterAgent.start();
}

main().catch(console.error);

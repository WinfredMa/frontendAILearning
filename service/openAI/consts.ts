import { OpenAI } from "openai";
const openai = new OpenAI({
    apiKey: process.env.SILICON_FLOW_API_KEY,
    baseURL: 'https://api.siliconflow.cn/v1'
});

export { openai }
import { handleWebhook } from "../lib/stripeBilling";

export const POST = async (req: Request) => {
    return await handleWebhook(req);
};
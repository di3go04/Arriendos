import NextAuth from "next-auth";
import { ssoOptions } from "../lib/providers";

const { handlers: { GET, POST } } = NextAuth(ssoOptions);
export { GET, POST };
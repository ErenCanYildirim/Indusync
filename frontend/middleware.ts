import createMiddleware from "next-intl/middleware";
import { locales } from "./i18n";

export default createMiddleware({
    locales,
    defaultLocale: "de",
    localePrefix: "always",
    localeDetection: true,
});

export const config = {
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv = __importStar(require("dotenv"));
const http = __importStar(require("http"));
const services_1 = require("./db/services");
// Import commands
const personal_1 = require("./commands/personal");
const friends_1 = require("./commands/friends");
const split_1 = require("./commands/split");
const balance_1 = require("./commands/balance");
dotenv.config();
const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error("BOT_TOKEN must be provided in .env!");
}
const bot = new telegraf_1.Telegraf(token);
// Middleware to ensure user exists
bot.use(async (ctx, next) => {
    if (ctx.from) {
        await (0, services_1.getOrCreateUser)(ctx.from.id, ctx.from.username);
    }
    return next();
});
// Setup Commands
bot.start((ctx) => {
    const helpText = `
👋 *Welcome to the Expense Manager!*

I will help you track your spending and debts.

*Commands:*
/add <amount> <desc> - Log personal expense
/stats - See your spending total
/friend add <name> - Add a friend to your ledger
/friend list - See all friends
/split <amount> <desc> /with <friends> - Divide a bill
/balances - See who owes you money
/settle <name> - Clear a friend's debt
  `;
    ctx.reply(helpText, { parse_mode: "Markdown" });
});
(0, personal_1.setupPersonalCommands)(bot);
(0, friends_1.setupFriendCommands)(bot);
(0, split_1.setupSplitCommand)(bot);
(0, balance_1.setupBalanceCommands)(bot);
bot.launch().then(() => {
    console.log("Bot is running in SINGLE-USER mode!");
});
// Simple health check server for Render
const port = process.env.PORT || 3000;
http
    .createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is alive!");
})
    .listen(port);
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

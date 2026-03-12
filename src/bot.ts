import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";
import * as http from "http";
import { IncomingMessage, ServerResponse } from "http";
import { getOrCreateUser } from "./db/services";

// Import commands
import { setupPersonalCommands } from "./commands/personal";
import { setupFriendCommands } from "./commands/friends";
import { setupSplitCommand } from "./commands/split";
import { setupBalanceCommands } from "./commands/balance";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN must be provided in .env!");
}

const bot = new Telegraf(token);

// Middleware to ensure user exists
bot.use(async (ctx, next) => {
  if (ctx.from) {
    await getOrCreateUser(ctx.from.id, ctx.from.username);
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

setupPersonalCommands(bot);
setupFriendCommands(bot);
setupSplitCommand(bot);
setupBalanceCommands(bot);

bot.launch().then(() => {
  console.log("Bot is running in SINGLE-USER mode!");
});

// Simple health check server for Render
const port = process.env.PORT || 3000;
http
  .createServer((req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200);
    res.end("Bot is alive!");
  })
  .listen(port);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

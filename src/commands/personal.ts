import { Telegraf } from "telegraf";
import { addPersonalExpense, getStats, getTodayExpenses } from "../db/services";
import { formatVND } from "../utils/format";

export function setupPersonalCommands(bot: Telegraf) {
  // /add <amount> <desc>
  bot.command("add", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
      return ctx.reply("Usage: /add <amount> <description>");
    }

    const amount = parseFloat(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply("Invalid amount.");
    }

    const description = args.slice(2).join(" ");

    try {
      await addPersonalExpense(ctx.from.id, amount, description);
      ctx.reply(
        `✅ Logged personal expense: *${formatVND(amount)}* for ${description}`,
        { parse_mode: "Markdown" },
      );
    } catch (e) {
      console.error(e);
      ctx.reply("❌ Failed to log expense.");
    }
  });

  // /stats
  bot.command("stats", async (ctx) => {
    try {
      const stats = await getStats(ctx.from.id);
      let text = "📊 *Your Spending Stats*\n\n";
      text += `Today: *${formatVND(stats.todayTotal)}*\n`;
      text += `This Month: *${formatVND(stats.monthTotal)}*\n`;
      text += `All Time: *${formatVND(stats.allTimeTotal)}*\n`;
      text += "\n_(Shows your portion only)_";

      ctx.reply(text, { parse_mode: "Markdown" });
    } catch (e) {
      console.error(e);
      ctx.reply("❌ Failed to fetch stats.");
    }
  });

  // /today
  bot.command("today", async (ctx) => {
    try {
      const expenses = await getTodayExpenses(ctx.from.id);
      if (expenses.length === 0) {
        return ctx.reply("You haven't logged any expenses today.");
      }

      let text = "📅 *Today's Spending List:*\n\n";
      let total = 0;

      expenses.forEach((exp) => {
        text += `- ${exp.description}: *${formatVND(exp.amount)}*\n`;
        total += exp.amount;
      });

      text += `\n💰 *Total Today: ${formatVND(total)}*`;

      ctx.reply(text, { parse_mode: "Markdown" });
    } catch (e) {
      console.error(e);
      ctx.reply("❌ Failed to fetch today's expenses.");
    }
  });
}

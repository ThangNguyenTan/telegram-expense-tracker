import { Telegraf } from "telegraf";
import { addPersonalExpense, getStats } from "../db/services";

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
        `✅ Logged personal expense: $${amount.toFixed(2)} for ${description}`,
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
      text += `Today: $${stats.todayTotal.toFixed(2)}\n`;
      text += `This Month: $${stats.monthTotal.toFixed(2)}\n`;
      text += `All Time: $${stats.allTimeTotal.toFixed(2)}\n`;
      text += "\n_(Shows your portion only)_";

      ctx.reply(text, { parse_mode: "Markdown" });
    } catch (e) {
      console.error(e);
      ctx.reply("❌ Failed to fetch stats.");
    }
  });
}

import { Telegraf } from "telegraf";
import { getBalances, settleFriend } from "../db/services";
import { formatVND } from "../utils/format";

export function setupBalanceCommands(bot: Telegraf) {
  // /balances
  bot.command("balances", async (ctx) => {
    try {
      const balances = await getBalances(ctx.from.id);
      if (balances.length === 0)
        return ctx.reply("No outstanding debts. Everyone is settled!");

      let text = "💰 *Outstanding Debts to You:*\n\n";
      balances.forEach((b) => {
        text += `- ${b.name}: owes you *${formatVND(b.amount)}*\n`;
      });
      text += "\nUse /settle <name> to clear a debt.";

      ctx.reply(text, { parse_mode: "Markdown" });
    } catch (e) {
      ctx.reply("❌ Failed to fetch balances.");
    }
  });

  // /settle <name>
  bot.command("settle", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("Usage: /settle <friend_name>");

    const friendName = args.slice(1).join(" ");

    try {
      await settleFriend(ctx.from.id, friendName);
      ctx.reply(`✅ Settled all debts for ${friendName}.`);
    } catch (e: any) {
      ctx.reply(`❌ ${e.message}`);
    }
  });
}

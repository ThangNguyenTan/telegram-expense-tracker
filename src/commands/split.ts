import { Telegraf } from "telegraf";
import { splitExpenseWithFriends } from "../db/services";

export function setupSplitCommand(bot: Telegraf) {
  // /split 100 Dinner /with Bob Alice
  bot.command("split", async (ctx) => {
    const text = ctx.message.text;
    const parts = text.split(" /with ");

    if (parts.length < 2) {
      return ctx.reply(
        "Usage: /split <amount> <description> /with <friend1> <friend2>...",
      );
    }

    const mainPart = parts[0].split(" "); // ["/split", "100", "Dinner"]
    if (mainPart.length < 3) {
      return ctx.reply(
        "Usage: /split <amount> <description> /with <friend1> <friend2>...",
      );
    }

    const amount = parseFloat(mainPart[1]);
    if (isNaN(amount) || amount <= 0) return ctx.reply("Invalid amount.");

    const description = mainPart.slice(2).join(" ");

    // Friends are in the second part, split by space or comma
    const friendNames = parts[1].split(/[\s,]+/).filter((n) => n.length > 0);

    if (friendNames.length === 0) {
      return ctx.reply("Please specify at least one friend after /with");
    }

    try {
      const result = await splitExpenseWithFriends(
        ctx.from.id,
        amount,
        description,
        friendNames,
      );

      let replyText = `💸 *Expense Split Recorded!*\n\n`;
      replyText += `Total: $${amount.toFixed(2)} (${description})\n`;
      replyText += `Split with: ${friendNames.join(", ")}\n`;
      replyText += `*Each owes you: $${result.splitAmount.toFixed(2)}*`;

      ctx.reply(replyText, { parse_mode: "Markdown" });
    } catch (e: any) {
      ctx.reply(`❌ ${e.message}`);
    }
  });
}

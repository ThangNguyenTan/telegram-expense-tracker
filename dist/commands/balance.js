"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBalanceCommands = setupBalanceCommands;
const services_1 = require("../db/services");
function setupBalanceCommands(bot) {
    // /balances
    bot.command("balances", async (ctx) => {
        try {
            const balances = await (0, services_1.getBalances)(ctx.from.id);
            if (balances.length === 0)
                return ctx.reply("No outstanding debts. Everyone is settled!");
            let text = "💰 *Outstanding Debts to You:*\n\n";
            balances.forEach((b) => {
                text += `- ${b.name}: owes you $${b.amount.toFixed(2)}\n`;
            });
            text += "\nUse /settle <name> to clear a debt.";
            ctx.reply(text, { parse_mode: "Markdown" });
        }
        catch (e) {
            ctx.reply("❌ Failed to fetch balances.");
        }
    });
    // /settle <name>
    bot.command("settle", async (ctx) => {
        const args = ctx.message.text.split(" ");
        if (args.length < 2)
            return ctx.reply("Usage: /settle <friend_name>");
        const friendName = args.slice(1).join(" ");
        try {
            await (0, services_1.settleFriend)(ctx.from.id, friendName);
            ctx.reply(`✅ Settled all debts for ${friendName}.`);
        }
        catch (e) {
            ctx.reply(`❌ ${e.message}`);
        }
    });
}

import { Telegraf } from "telegraf";
import { addFriend, listFriends, removeFriend } from "../db/services";

export function setupFriendCommands(bot: Telegraf) {
  // /friend add <name>
  // /friend list
  // /friend remove <name>
  bot.command("friend", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply(
        "Usage:\n/friend add <name>\n/friend list\n/friend remove <name>",
      );
    }

    const subCommand = args[1].toLowerCase();

    if (subCommand === "add") {
      const name = args.slice(2).join(" ");
      if (!name) return ctx.reply("Please provide a name.");
      try {
        await addFriend(ctx.from.id, name);
        ctx.reply(`👤 Added friend: ${name}`);
      } catch (e: any) {
        if (e.code === "P2002")
          return ctx.reply("❌ This friend already exists.");
        ctx.reply("❌ Failed to add friend.");
      }
    } else if (subCommand === "list") {
      try {
        const friends = await listFriends(ctx.from.id);
        if (friends.length === 0)
          return ctx.reply("You have no friends added yet.");
        const text =
          "👥 *Your Friends:*\n" + friends.map((f) => `- ${f.name}`).join("\n");
        ctx.reply(text, { parse_mode: "Markdown" });
      } catch (e) {
        ctx.reply("❌ Failed to list friends.");
      }
    } else if (subCommand === "remove" || subCommand === "delete") {
      const name = args.slice(2).join(" ");
      if (!name) return ctx.reply("Please provide a name.");
      try {
        await removeFriend(ctx.from.id, name);
        ctx.reply(`🗑️ Removed friend: ${name}`);
      } catch (e) {
        ctx.reply("❌ Friend not found or could not be removed.");
      }
    }
  });
}

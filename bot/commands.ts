export interface CommandContext {
  text: string;
  chatType: "private" | "group" | "supergroup";
  userId: number;
  botUsername: string;
  adminIds: ReadonlySet<number>;
}

export interface CommandResponse {
  text: string;
  openApp?: boolean;
}

export function parseCommand(text: string, botUsername: string): { name: string; args: string[] } | null {
  const [head, ...args] = text.trim().split(/\s+/);
  if (!head?.startsWith("/")) return null;
  const [rawName, mention] = head.slice(1).split("@", 2);
  if (mention && mention.toLowerCase() !== botUsername.toLowerCase()) return null;
  if (!rawName || !/^[a-z0-9_]+$/i.test(rawName)) return null;
  return { name: rawName.toLowerCase(), args };
}

export function handleCommand(context: CommandContext): CommandResponse | null {
  const command = parseCommand(context.text, context.botUsername);
  if (!command) return null;
  switch (command.name) {
    case "app":
      return { text: "Open the workspace to review your current items.", openApp: true };
    case "status":
      return { text: context.chatType === "private" ? "Your workspace is ready." : "This chat workspace is connected." };
    case "help":
      return { text: "/app - open workspace\n/status - current state\n/help - command list" };
    case "sync":
      return context.adminIds.has(context.userId)
        ? { text: "Sync requested. The result will be posted when complete." }
        : { text: "This command is available to chat admins." };
    default:
      return null;
  }
}

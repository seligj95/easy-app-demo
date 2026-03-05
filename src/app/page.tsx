import { ChatWindow } from "@/components/chat/chat-window";

export default function Home() {
  return (
    <main className="flex h-[calc(100vh-44px)] flex-col bg-white dark:bg-zinc-950">
      <ChatWindow />
    </main>
  );
}


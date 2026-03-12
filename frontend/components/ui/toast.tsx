"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import * as React from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

const ToastContext = React.createContext<{
  push: (message: Omit<ToastMessage, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const push = React.useCallback((message: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id, ...message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            open
            onOpenChange={(open) => {
              if (!open) {
                setMessages((current) => current.filter((item) => item.id !== message.id));
              }
            }}
            className="mb-3 flex w-[360px] items-start justify-between rounded-3xl border border-white/70 bg-white/90 p-4 shadow-glass backdrop-blur-xl"
          >
            <div>
              <ToastPrimitive.Title className="font-semibold text-slate-900">
                {message.title}
              </ToastPrimitive.Title>
              {message.description ? (
                <ToastPrimitive.Description className="mt-1 text-sm text-slate-600">
                  {message.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-[390px] flex-col outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

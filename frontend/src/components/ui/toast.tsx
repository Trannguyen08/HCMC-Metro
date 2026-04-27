"use client";

import React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, Toast as ToastType } from "@/store/use-toast-store";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Matches the animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgClass = () => {
    switch (toast.type) {
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-900";
      case "error":
        return "bg-rose-50 border-rose-200 text-rose-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  return (
    <div
      className={`relative flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 ${getBgClass()} ${
        isRemoving ? "translate-x-full opacity-0" : "animate-in slide-in-from-right-full fade-in"
      }`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

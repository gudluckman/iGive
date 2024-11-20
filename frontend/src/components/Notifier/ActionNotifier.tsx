import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";

// Export functions for each notification type
export const successNotifier = (message: string) => {
  toast.success(
    <div style={{ display: "flex", alignItems: "center" }}>
      <span>{message}</span>
    </div>,
    {
      theme: "colored",
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }
  );
};

export const promiseNotifier = (
  promise: Promise<any>,
  messages: { pending: string; success: string; error: string }
) => {
  toast.promise(
    promise,
    {
      pending: messages.pending,
      success: messages.success,
      error: messages.error,
    },
    {
      theme: "colored",
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }
  );
};

export const alertNotifier = (message: string) => {
  toast.error(
    <div style={{ display: "flex", alignItems: "center" }}>
      <span>{message}</span>
    </div>,
    {
      theme: "colored",
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }
  );
};

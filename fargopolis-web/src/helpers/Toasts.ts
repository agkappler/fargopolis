import { toast } from "react-toastify";

export const successToast = (message: string) => toast(message, { type: "success" });
export const errorToast = (message: string) => toast(message, { type: "error" });
export const rollToast = (message: string) => toast(message, { type: "info" });
import { toast } from "sonner";

export function toastSuccess(message: string) {
  toast.success(message, { duration: 2500 });
}

export function toastError(message: string) {
  toast.error(message, { duration: 3000 });
}

export function toastInfo(message: string) {
  toast(message);
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JSX, useState } from "react";
import { Loader } from "@/components/ui/loader";

interface PasswordConfirmDialogProps {
  trigger: JSX.Element;
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<void>;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function PasswordConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmText = "Continue",
  cancelText = "Cancel",
  loading = false,
}: PasswordConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setError("");
    try {
      await onConfirm(password);
      setPassword("");
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword("");
      setError("");
    }
    setOpen(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="text-start">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
            className={error ? "border-red-500" : ""}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <AlertDialogFooter className="flex-row justify-end">
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={loading || !password.trim()}>
            {loading ? <Loader className="mr-2 h-4 w-4" /> : null}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

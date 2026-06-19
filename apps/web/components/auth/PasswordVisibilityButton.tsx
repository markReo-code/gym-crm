import React from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordVisibilityButtonProps = {
  isVisible: boolean;
  onClick: () => void;
};

const PasswordVisibilityButton = ({
  isVisible,
  onClick,
}: PasswordVisibilityButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isVisible ? "パスワードを非表示" : "パスワードを表示"}
      className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isVisible ? (
        <Eye className="size-4" aria-hidden="true" />
      ) : (
        <EyeOff className="size-4" aria-hidden="true" />
      )}
    </button>
  );
};

export default PasswordVisibilityButton;

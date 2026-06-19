"use client";

import { Button } from "@repo/ui/components/button";
import React from "react";
import { logout } from "../../lib/firebase/auth";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };
  return (
    <div>
      <Button type="button" onClick={handleLogout}>
        ログアウト
      </Button>
    </div>
  );
};

export default LogoutButton;

"use client";

import { useEffect } from "react";
import { logout } from "@/lib/session";

// トップページを開いたら、飼育員のログインを終える（一般の人として入り直す）
export default function KeeperReset() {
  useEffect(() => {
    void logout();
  }, []);
  return null;
}

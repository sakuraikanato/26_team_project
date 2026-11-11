"use client";

import { useEffect } from "react";

// トップページを開いたら、飼育員の印を消す（一般の人として入り直す）
export default function KeeperReset() {
  useEffect(() => {
    document.cookie = "role=; path=/; max-age=0";
  }, []);
  return null;
}

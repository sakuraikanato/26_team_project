"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fieldClass =
  "h-12 w-full rounded-lg border border-[#ccc] bg-white px-3.5 text-sm text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] outline-none placeholder:text-[#808080] focus:border-[#59ae69]";
const buttonClass =
  "flex h-12 w-full items-center justify-center rounded-lg border border-[#784c31] bg-[#f6985f] text-base font-bold text-[#fafafa] shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)]";

export default function LoginPage() {
  const router = useRouter();
  // POST /auth/login は email と password を送る
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (email === "" || password === "") {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    // TODO: POST /auth/login につなぐ。今はデモ用に飼育員の印を付けるだけ
    document.cookie = "role=keeper; path=/";
    router.push("/album");
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#333]">
      {/* ヘッダー */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#ccc] bg-[#59ae69] px-4">
        <Link href="/" aria-label="トップに戻る">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/back.svg" alt="" width={22} height={22} />
        </Link>
        <h1 className="text-[17px] font-bold text-[#fafafa]">
          飼育員アカウントでログイン
        </h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-[37px] px-5 pb-[120px] pt-5">
        {/* 一般の人向けの案内 */}
        <div className="flex w-full flex-col gap-4">
          <p className="text-center text-base text-black">
            一般の方はログインできません。
            <br />
            戻って「すぐにはじめる」からご覧ください
          </p>
          <Link href="/" className={buttonClass}>
            戻る
          </Link>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/dashed-line.svg"
          alt=""
          width={350}
          height={2}
          className="w-full"
        />

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="flex w-full flex-col gap-[15px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold">メールアドレス</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold">パスワード</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>

          <button type="submit" className={buttonClass}>
            飼育員アカウントでログイン
          </button>
        </form>
      </div>
    </main>
  );
}

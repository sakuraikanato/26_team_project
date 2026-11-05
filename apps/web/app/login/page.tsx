"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (userName === "" || password === "") {
      alert("飼育員名とパスワードを入力してください");
      return;
    }

    alert("ログインしました");
  };

  return (
    <main className="min-h-screen bg-white">

      {/* ヘッダー */}
      <header className="flex h-14 items-center bg-green-500 px-5">
        <Link
          href="/"
          className="mr-3 text-2xl leading-none text-white"
        >
          ←
        </Link>

        <h1 className="text-lg font-bold text-white">
          飼育員アカウントでログイン
        </h1>
      </header>

      {/* ログインフォーム */}
      <div className="mx-auto mt-32 w-[90%] max-w-[400px]">

        <p className="mb-7 text-center text-sm leading-relaxed text-gray-700">
          一般の方はログインできません。
          <br />
          戻って「すぐにはじめる」からご覧ください
        </p>

        <div className="flex flex-col">

          {/* 飼育員名 */}
          <label
            htmlFor="userName"
            className="mb-1.5 text-sm font-bold text-gray-700"
          >
            飼育員名
          </label>

          <input
            id="userName"
            type="text"
            placeholder="飼育員名を入力"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="mb-4 h-12 rounded-md border border-gray-300 px-3.5 text-sm outline-none focus:border-green-500"
          />

          {/* パスワード */}
          <label
            htmlFor="password"
            className="mb-1.5 text-sm font-bold text-gray-700"
          >
            パスワード
          </label>

          <input
            id="password"
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 h-12 rounded-md border border-gray-300 px-3.5 text-sm outline-none focus:border-green-500"
          />

          {/* ログインボタン */}
          <button
            onClick={handleLogin}
            className="mt-1 h-12 rounded-md border border-orange-400 bg-orange-400 text-base font-bold text-white transition hover:bg-orange-500"
          >
            飼育員アカウントでログイン
          </button>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState, type FormEvent } from "react";
import { GUEST_NAME_MAX, saveGuestName } from "@/lib/guest";

// 初めてアルバムを開いたときに、画面の上に重ねて出す名前の入力
export default function NameDialog() {
  const [name, setName] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    saveGuestName(name);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-title"
        className="flex w-full max-w-[327px] flex-col gap-4 rounded-[11px] bg-[#fafafa] px-4 py-8 text-[#333] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
      >
        <div className="flex flex-col gap-1.5 text-center">
          <p id="name-title" className="text-xl font-bold">
            ようこそ！
          </p>
          <p className="text-[13px] text-[#808080]">
            コメントに表示する名前を入れてください
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">名前</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
            maxLength={GUEST_NAME_MAX}
            required
            autoFocus
            className="h-12 w-full rounded-lg border border-[#ccc] bg-white px-3.5 text-sm text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] outline-none placeholder:text-[#808080] focus:border-[#59ae69]"
          />
        </label>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-lg border border-[#784c31] bg-[#f6985f] text-base font-bold text-[#fafafa] shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)]"
        >
          はじめる
        </button>
      </form>
    </div>
  );
}

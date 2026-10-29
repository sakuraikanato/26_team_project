import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-5 pt-28 pb-10">

        {/* 写真エリア */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="h-20 rounded-sm bg-gray-200"></div>
          <div className="h-20 rounded-sm bg-gray-200"></div>
          <div className="h-20 rounded-sm bg-gray-200"></div>

          <div className="h-20 rounded-sm bg-gray-200"></div>
          <div className="h-20 rounded-sm bg-gray-200"></div>
          <div className="h-20 rounded-sm bg-gray-200"></div>
        </div>

        {/* タイトル */}
        <h1 className="mb-10 text-center text-2xl font-bold leading-tight text-gray-800">
          晴の日、雨の日
          <br />
          動物園アルバム
        </h1>

        {/* すぐにはじめる */}
        <div className="flex h-11 w-full items-center justify-center rounded-md border border-orange-400 bg-orange-400 text-base font-bold text-white">
          すぐにはじめる
        </div>

        {/* 区切り線 */}
        <div className="my-7 border-t-2 border-dashed border-green-400"></div>

        {/* 飼育員ログイン */}
        <Link
          href="/login"
          className="text-center text-sm text-gray-400 underline hover:text-gray-600"
        >
          飼育員はこちらからログイン
        </Link>
      </div>
    </main>
  );
}
"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CalendarEvent, WeatherForecast, WeatherIcon } from "@/lib/types";
import { photos as albumSeed } from "@/lib/album";
import { useIsKeeper } from "@/lib/keeper";
import { mergePhotos, useLocalPosts } from "@/lib/posts";

type Props = {
  initialEvents: CalendarEvent[];
  initialForecasts: WeatherForecast[];
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

// API（GET /weather/forecast）の icon を、Figma のアイコンに当てはめる
const WEATHER_ICON: Partial<Record<WeatherIcon, string>> = {
  sunny: "/icons/weather-sunny.svg",
  "partly-cloudy": "/icons/weather-sunny.svg",
  cloudy: "/icons/weather-cloudy.svg",
  fog: "/icons/weather-cloudy.svg",
  rain: "/icons/weather-rain.svg",
  thunder: "/icons/weather-rain.svg",
};

// POST /events の制約
const TITLE_MAX = 50;
const LOCATION_MAX = 50;
const TAG_MAX = 50;
const TAG_COUNT_MAX = 8;

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

function getJstDate(date: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function getJstTime(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

// 小さな天気アイコン（日付のマス・天気予報の行で使う）
// tone を指定すると、元の色に関係なく黒または白一色にする
function WeatherMark({
  icon,
  size,
  tone,
}: {
  icon: WeatherIcon;
  size: number;
  tone?: "black" | "white";
}) {
  // tone なし（天気予報の行）は、晴れ＝赤・雨＝青・曇り＝元の色
  const src =
    !tone && (icon === "rain" || icon === "thunder")
      ? "/icons/weather-rain-blue.svg"
      : WEATHER_ICON[icon];
  const toneClass =
    tone === "white"
      ? "brightness-0 invert"
      : tone === "black"
        ? "brightness-0"
        : "";

  // 雪だけは Figma にアイコンがないので絵文字で出す
  if (!src) {
    return (
      <span
        className={`leading-none ${toneClass}`}
        style={{ fontSize: size }}
        aria-hidden
      >
        ❄️
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className={toneClass} />
  );
}

const labelClass = "text-sm font-bold text-[#333]";
const fieldClass =
  "h-12 w-full rounded-lg border border-[#ccc] bg-white px-3.5 text-sm text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] outline-none placeholder:text-[#808080] focus:border-[#59ae69]";

export default function CalendarClient({
  initialEvents,
  initialForecasts,
}: Props) {
  const keeper = useIsKeeper();
  const localPosts = useLocalPosts();

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState("2026-10-31");
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);

  // イベント登録フォーム（POST /events の項目）
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [eventDate, setEventDate] = useState("2026-10-31");
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("12:00");
  const [formError, setFormError] = useState("");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const selected = new Date(`${selectedDate}T12:00:00`);

  const selectedEvents = useMemo(() => {
    return events
      .filter((event) => getJstDate(event.startDate) === selectedDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events, selectedDate]);

  const selectedWeather = initialForecasts.find(
    (weather) => weather.date === selectedDate
  );

  // 過去に使ったタグ（アルバムとイベントから。まだ選んでいないもの）
  const pastTags = useMemo(
    () =>
      Array.from(
        new Set([
          ...mergePhotos(albumSeed, localPosts).flatMap((p) => p.tags),
          ...events.flatMap((e) => e.tags ?? []),
        ])
      ).filter((t) => !tags.includes(t)),
    [localPosts, events, tags]
  );

  function changeMonth(amount: number) {
    const next = new Date(year, month + amount, 1);
    setCurrentMonth(next);
    setSelectedDate(formatDate(next.getFullYear(), next.getMonth(), 1));
  }

  function selectDay(day: number) {
    setSelectedDate(formatDate(year, month, day));
  }

  function openForm() {
    setTitle("");
    setLocation("");
    setTags([]);
    setTagInput("");
    setEventDate(selectedDate);
    setStartTime("11:00");
    setEndTime("12:00");
    setFormError("");
    setShowForm(true);
    window.scrollTo(0, 0);
  }

  function addTag(text: string) {
    const t = text.trim().slice(0, TAG_MAX);
    if (!t || tags.includes(t) || tags.length >= TAG_COUNT_MAX) return;
    setTags([...tags, t]);
  }

  function registerEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    const start = new Date(`${eventDate}T${startTime}:00+09:00`);
    const end = new Date(`${eventDate}T${endTime}:00+09:00`);

    // API では endDate は startDate より後でないといけない
    if (end <= start) {
      setFormError("終わりの時間は、始まりの時間より後にしてください");
      return;
    }

    // TODO: POST /events につなぐ（今は画面の中だけに追加）
    const newEvent: CalendarEvent = {
      id: `test-${Date.now()}`,
      title: title.trim(),
      location: location.trim() || undefined,
      tags,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };

    setEvents((previous) => [...previous, newEvent]);
    setSelectedDate(eventDate);
    setCurrentMonth(
      new Date(
        Number(eventDate.slice(0, 4)),
        Number(eventDate.slice(5, 7)) - 1,
        1
      )
    );
    setShowForm(false);
  }

  if (showForm) {
    /* イベント登録画面（飼育員のみ） */
    return (
      <div className="relative mx-auto min-h-screen w-full max-w-full bg-white text-[#333]">
        <header className="flex h-14 items-center gap-2 border-b border-[#ccc] bg-[#59ae69] px-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            aria-label="戻る"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/back.svg" alt="" width={22} height={22} />
          </button>
          <h1 className="flex-1 text-[17px] font-bold text-[#fafafa]">
            イベントを投稿する
          </h1>
        </header>

        <form
          onSubmit={registerEvent}
          className="flex flex-col gap-4 px-5 pb-5 pt-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>イベント名</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="イベント名を入力"
              maxLength={TITLE_MAX}
              required
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>場所</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="場所を入力"
              maxLength={LOCATION_MAX}
              className={fieldClass}
            />
          </label>

          {/* 動物のタグ付け（8個まで） */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>動物のタグ付け</span>
            <div className="flex gap-1.5">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  // 日本語の変換を確定するEnterでは、追加しない
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  }
                }}
                placeholder="新しくタグを入力"
                maxLength={TAG_MAX}
                aria-label="新しいタグ"
                className={`${fieldClass} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => {
                  addTag(tagInput);
                  setTagInput("");
                }}
                disabled={tags.length >= TAG_COUNT_MAX}
                className="h-12 w-[73px] shrink-0 rounded-lg bg-[#f6985f] text-base font-bold text-white shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)] disabled:opacity-50"
              >
                追加
              </button>
            </div>

            <div className="relative">
              <select
                value=""
                onChange={(e) => addTag(e.target.value)}
                disabled={tags.length >= TAG_COUNT_MAX}
                aria-label="過去に使ったタグから選択"
                className="h-12 w-full appearance-none rounded-lg border border-[#ccc] bg-white px-3.5 pr-10 text-sm text-[#808080] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25)] outline-none focus:border-[#59ae69]"
              >
                <option value="">過去に使ったタグから選択</option>
                {pastTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/chevron-down.svg"
                alt=""
                width={18}
                height={18}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
              />
            </div>

            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 py-2">
                {tags.map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-1 rounded-2xl bg-[#fafafa] px-3 py-1.5 text-xs font-bold text-black shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`${t}を外す`}
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-[#333]">
              イベント日
            </span>
            <span className="relative block">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className={`${fieldClass} pr-10 shadow-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:opacity-0`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/calendar-field.svg"
                alt=""
                width={19.48}
                height={21.18}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
              />
            </span>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-[#333]">
              イベント時間
            </span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                aria-label="始まりの時間"
                className={`${fieldClass} min-w-0 flex-1 shadow-none`}
              />
              <span className="text-sm text-black">〜</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                aria-label="終わりの時間"
                className={`${fieldClass} min-w-0 flex-1 shadow-none`}
              />
            </div>
            {formError && (
              <p className="text-xs text-[#ef5b5b]" role="alert">
                {formError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-lg border border-[#784c31] bg-[#f6985f] text-base font-bold text-[#fafafa] shadow-[inset_0_-4px_4px_rgba(0,0,0,0.25)]"
          >
            投稿する
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-full pb-16 text-[#333]">
      <main className="flex flex-col gap-3 px-5 pb-5 pt-4">
        {/* 年月切り替え */}
        <header className="flex items-center justify-between font-bold">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="前の月"
            className="px-1 text-lg leading-none"
          >
            ‹
          </button>
          <h1 className="text-base">
            {year}年{month + 1}月
          </h1>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="次の月"
            className="px-1 text-lg leading-none"
          >
            ›
          </button>
        </header>

        <div className="flex flex-col gap-0.5">
          {/* 曜日 */}
          <div className="grid grid-cols-7">
            {weekdays.map((day) => (
              <div
                key={day}
                className="flex justify-center py-1 text-[11px] text-[#808080]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付 */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-10" />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
              (day) => {
                const date = formatDate(year, month, day);
                const isSelected = date === selectedDate;
                const weather = initialForecasts.find(
                  (item) => item.date === date
                );
                const hasEvent = events.some(
                  (event) => getJstDate(event.startDate) === date
                );

                return (
                  <button
                    type="button"
                    key={date}
                    onClick={() => selectDay(day)}
                    aria-pressed={isSelected}
                    aria-label={`${month + 1}月${day}日${
                      weather ? `・${weather.label}` : ""
                    }${hasEvent ? "・イベントあり" : ""}`}
                    className={`relative flex h-10 flex-col items-center gap-0.5 rounded-md text-[13px] ${
                      weather ? "pt-[3px]" : "pt-1.5"
                    } ${
                      isSelected
                        ? "bg-[#f6985f] font-bold text-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25)]"
                        : "text-[#333]"
                    }`}
                  >
                    <span className="leading-none">{day}</span>
                    {weather && (
                      <WeatherMark
                        icon={weather.icon}
                        size={13}
                        tone={isSelected ? "white" : "black"}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* 選んだ日のイベント */}
        <h2 className="text-sm font-bold">
          {selected.getMonth() + 1}月{selected.getDate()}日（
          {weekdays[selected.getDay()]}）のイベント
        </h2>

        <div className="flex items-center gap-1.5 text-xs text-[#808080]">
          {selectedWeather ? (
            <>
              <WeatherMark icon={selectedWeather.icon} size={16} />
              <span>
                天気予報：{selectedWeather.label}{" "}
                {Math.round(selectedWeather.tempMax)}℃
              </span>
            </>
          ) : (
            <span>天気予報：この日の情報はありません</span>
          )}
        </div>

        {selectedEvents.length > 0 ? (
          selectedEvents.map((event) => (
            <article
              key={event.id}
              className="flex items-center gap-3 rounded-lg bg-[#59ae69] px-3 py-2.5 text-[#fafafa] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
            >
              <span className="shrink-0 text-base font-bold">
                {getJstTime(event.startDate)}
              </span>
              <span className="w-px self-stretch bg-[#fafafa]" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 className="truncate text-base font-bold">{event.title}</h3>
                {event.location && (
                  <p className="truncate text-[11px]">場所：{event.location}</p>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-[#808080]">
            この日のイベントはありません
          </p>
        )}
      </main>

      {/* イベント登録ボタン（飼育員だけ） */}
      {keeper && (
        <div className="pointer-events-none fixed bottom-[90px] left-1/2 z-20 flex w-full max-w-full -translate-x-1/2 justify-end px-5">
          <button
            type="button"
            onClick={openForm}
            className="pointer-events-auto flex h-[42px] items-center gap-1.5 rounded-3xl bg-[#f6985f] px-[18px] text-base font-bold text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/plus.svg" alt="" width={18} height={18} />
            イベントを登録する
          </button>
        </div>
      )}

      {/* 下部ナビ */}
      <nav className="fixed bottom-0 left-1/2 z-30 flex h-16 w-full max-w-full -translate-x-1/2 bg-white">
        <Link
          href="/album"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#fafafa] text-[10px] text-[#555] shadow-[inset_0_-3px_4px_rgba(0,0,0,0.25)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/tab-album-off.svg" alt="" width={22} height={22} />
          <span>アルバム</span>
        </Link>
        <Link
          href="/calendar"
          aria-current="page"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#59ae69] text-[10px] text-[#fafafa] shadow-[inset_0_4px_4px_rgba(0,0,0,0.25)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/tab-calendar-on.svg" alt="" width={22} height={22} />
          <span>カレンダー</span>
        </Link>
      </nav>
    </div>
  );
}

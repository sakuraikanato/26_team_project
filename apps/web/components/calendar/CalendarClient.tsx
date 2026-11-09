
"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type {
  CalendarEvent,
  WeatherForecast,
} from "@/lib/types";

type Props = {
  initialEvents: CalendarEvent[];
  initialForecasts: WeatherForecast[];
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

const weatherIcons: Record<string, string> = {
  sunny: "☀️",
  "partly-cloudy": "🌤️",
  cloudy: "☁️",
  fog: "🌫️",
  rain: "🌧️",
  snow: "❄️",
  thunder: "⚡",
};

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

export default function CalendarClient({
  initialEvents,
  initialForecasts,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(2026, 9, 1)
  );

  const [selectedDate, setSelectedDate] = useState("2026-10-31");

  const [events, setEvents] = useState(initialEvents);

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("2026-10-31");
  const [eventTime, setEventTime] = useState("11:00");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const selected = new Date(`${selectedDate}T12:00:00`);

  const selectedEvents = useMemo(() => {
    return events
      .filter(
        (event) => getJstDate(event.startDate) === selectedDate
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events, selectedDate]);

  const selectedWeather = initialForecasts.find(
    (weather) => weather.date === selectedDate
  );

  function changeMonth(amount: number) {
    const next = new Date(year, month + amount, 1);

    setCurrentMonth(next);
    setSelectedDate(
      formatDate(next.getFullYear(), next.getMonth(), 1)
    );
  }

  function selectDay(day: number) {
    setSelectedDate(formatDate(year, month, day));
  }

  function openForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate(selectedDate);
    setEventTime("11:00");
    setShowForm(true);
  }

  function registerEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    const start = new Date(
      `${eventDate}T${eventTime}:00+09:00`
    );

    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const newEvent: CalendarEvent = {
      id: `test-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
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

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-white pb-16 text-[#2b2b2b]">

      {showForm ? (
        /* イベント登録画面 */
        <main className="min-h-screen px-4 pb-10">

          <header className="grid h-16 grid-cols-[45px_1fr_45px] items-center text-center">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-4xl"
            >
              ‹
            </button>

            <h1 className="text-xl font-bold">
              イベントを登録する
            </h1>

            <span />
          </header>

          <form
            onSubmit={registerEvent}
            className="flex flex-col gap-3"
          >
            <label className="mt-3 text-sm font-bold">
              イベント名
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="イベント名を入力"
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-[#f5955a]"
            />

            <label className="mt-3 text-sm font-bold">
              イベント内容
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="イベントの説明"
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-[#f5955a]"
            />

            <label className="mt-3 text-sm font-bold">
              場所
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：ペンギン舎前"
              maxLength={50}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-[#f5955a]"
            />

            <label className="mt-3 text-sm font-bold">
              日付
            </label>

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />

            <label className="mt-3 text-sm font-bold">
              開始時間
            </label>

            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />

            <button
              type="submit"
              className="mt-6 rounded-full bg-[#f5955a] py-4 text-base font-bold text-white shadow-lg"
            >
              イベントを登録する
            </button>
          </form>
        </main>
      ) : (
        <>
          {/* カレンダー本体 */}
          <main className="px-3">

            {/* 年月切り替え */}
            <header className="grid h-16 grid-cols-[45px_1fr_45px] items-center text-center">

              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="前の月"
                className="text-4xl font-bold text-[#444]"
              >
                ‹
              </button>

              <h1 className="text-[25px] font-bold">
                {year}年{month + 1}月
              </h1>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="次の月"
                className="text-4xl font-bold text-[#444]"
              >
                ›
              </button>
            </header>

            {/* 曜日 */}
            <div className="grid grid-cols-7">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="flex h-10 items-center justify-center text-sm text-[#929292]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日付 */}
            <div className="grid grid-cols-7 gap-y-1">

              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-[58px]" />
              ))}

              {Array.from(
                { length: daysInMonth },
                (_, index) => index + 1
              ).map((day) => {
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
                    className={`relative flex h-[58px] flex-col items-center rounded-xl pt-2 text-[19px] transition ${
                      isSelected
                        ? "bg-[#ff965f] font-bold text-white shadow-md"
                        : "text-[#333] hover:bg-orange-50"
                    }`}
                  >
                    <span>{day}</span>

                    {weather && (
                      <span className="mt-0.5 text-sm leading-none">
                        {weatherIcons[weather.icon] ?? "☀️"}
                      </span>
                    )}

                    {hasEvent && (
                      <span
                        className={`absolute bottom-1 h-1 w-1 rounded-full ${
                          isSelected ? "bg-white" : "bg-[#ff965f]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 選択日のイベント */}
            <section className="mt-5 px-1">

              <h2 className="text-[21px] font-bold">
                {selected.getMonth() + 1}月
                {selected.getDate()}日
                （{weekdays[selected.getDay()]}）のイベント
              </h2>

              {/* 天気 */}
              <div className="mt-5 flex items-center gap-2 text-[16px] text-[#929292]">

                {selectedWeather ? (
                  <>
                    <span className="text-2xl">
                      {weatherIcons[selectedWeather.icon] ?? "☀️"}
                    </span>

                    <span>
                      天気予報：{selectedWeather.label}{" "}
                      {Math.round(selectedWeather.tempMax)}°C
                    </span>
                  </>
                ) : (
                  <span>
                    天気予報：この日の情報はありません
                  </span>
                )}
              </div>

              {/* イベント一覧 */}
              <div className="mt-8 flex flex-col gap-3">

                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-xl bg-[#f8f8f8] p-4"
                    >
                      <div className="flex gap-3">

                        <span className="text-base font-bold text-[#f5955a]">
                          {getJstTime(event.startDate)}
                        </span>

                        <div className="min-w-0 flex-1">

                          <h3 className="text-base font-bold">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="mt-2 text-sm text-gray-500">
                              {event.description}
                            </p>
                          )}

                          {event.location && (
                            <p className="mt-1 text-sm text-gray-500">
                              場所：{event.location}
                            </p>
                          )}

                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="mt-16 text-[16px] font-medium text-[#929292]">
                    この日のイベントはありません。
                  </p>
                )}

              </div>
            </section>
          </main>

          {/* イベント登録ボタン */}
            <div className="pointer-events-none fixed bottom-20 left-1/2 z-20 flex w-full max-w-[390px] -translate-x-1/2 justify-end px-4">
            <button
                onClick={() => setIsFormOpen(true)}
                className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5955a] text-3xl text-white shadow-lg"
            >
                +
            </button>
            </div>
        </>
      )}

      {/* 下部ナビ */}
      {!showForm && (
        <nav className="fixed bottom-0 left-1/2 z-30 flex h-16 w-full max-w-[390px] -translate-x-1/2 border-t border-gray-300 bg-white">

          <Link
            href="/album"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-gray-600"
          >
            <span className="text-xl" aria-hidden>
              🖼
            </span>
            <span>アルバム</span>
          </Link>

          <Link
            href="/calendar"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#5aaa64] text-[11px] text-white"
          >
            <span className="text-xl" aria-hidden>
              ▦
            </span>
            <span>カレンダー</span>
          </Link>

        </nav>
      )}

    </div>
  );
}

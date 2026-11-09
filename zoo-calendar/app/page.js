
'use client';

import { useState, useEffect } from 'react';
import './globals.css';

const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

const initialEvents = [
  {
    date: '2026-10-23',
    time: '11:00',
    title: 'ライオンのお食事タイム',
    place: 'ライオンエリア',
    tags: ['ライオン（タロウ）'],
  },
  {
    date: '2026-10-23',
    time: '13:30',
    title: 'ペンギンのお散歩',
    place: 'ペンギン館前',
    tags: ['ペンギン'],
  },
  {
    date: '2026-10-23',
    time: '15:00',
    title: '飼育員 山田：ゾウのガイド',
    place: 'ゾウエリア',
    tags: ['ゾウ'],
  },
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getWeatherInfo(code) {
  if (code === 0) return { icon: '☀️', text: '快晴' };
  if (code === 1) return { icon: '🌤️', text: '晴れ' };
  if (code === 2) return { icon: '⛅', text: '一部曇り' };
  if (code === 3) return { icon: '☁️', text: '曇り' };

  if ([45, 48].includes(code)) {
    return { icon: '🌫️', text: '霧' };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { icon: '🌦️', text: '霧雨' };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: '🌧️', text: '雨' };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: '❄️', text: '雪' };
  }

  if ([95, 96, 99].includes(code)) {
    return { icon: '⛈️', text: '雷雨' };
  }

  return { icon: '🌤️', text: '天気情報' };
}

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date())
  );

  // イベント情報
  const [events, setEvents] = useState(initialEvents);

  // 画面切り替え
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  // 投稿フォーム
  const [newTitle, setNewTitle] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [newDate, setNewDate] = useState(formatDate(new Date()));

  // 動物タグ
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState([
    'ライオン（タロウ）',
  ]);

  const [tagHistory, setTagHistory] = useState([
    'ライオン（タロウ）',
    'ペンギン',
    'ゾウ',
    'キリン',
  ]);

  // 天気情報
  const [weatherDays, setWeatherDays] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  // 天気API
  useEffect(() => {
    async function fetchWeather() {
      try {
        const url =
          'https://api.open-meteo.com/v1/forecast' +
          '?latitude=35.1815&longitude=136.9066' +
          '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
          '&timezone=Asia%2FTokyo&forecast_days=7';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('天気の取得に失敗しました');
        }

        const data = await response.json();

        setWeatherDays(
          data.daily.time.map((date, index) => ({
            date,
            code: data.daily.weather_code[index],
            max: data.daily.temperature_2m_max[index],
            min: data.daily.temperature_2m_min[index],
          }))
        );
      } catch (error) {
        console.error('天気の取得に失敗しました:', error);
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    }

    fetchWeather();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selected = new Date(`${selectedDate}T12:00:00`);

  const selectedEvents = events
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const selectedWeather = weatherDays.find(
    (item) => item.date === selectedDate
  );

  const weatherInfo = selectedWeather
    ? getWeatherInfo(selectedWeather.code)
    : null;

  // 月を変更
  function changeMonth(amount) {
    setCurrentMonth(new Date(year, month + amount, 1));
  }

  // 日付を選択
  function selectDay(day) {
    const date = formatDate(new Date(year, month, day));
    setSelectedDate(date);
  }

  // 投稿画面を開く
  function openPostForm() {
    setNewDate(selectedDate);
    setNewTitle('');
    setNewPlace('');
    setNewTime('11:00');
    setNewTag('');
    setSelectedTags([]);
    setShowForm(true);
  }

  // イベントを投稿
  function addEvent(e) {
    e.preventDefault();

    if (!newTitle.trim() || !newDate) {
      return;
    }

    const newEvent = {
      date: newDate,
      time: newTime,
      title: newTitle.trim(),
      place: newPlace.trim() || '場所未設定',
      tags: [...selectedTags],
    };

    setEvents((previous) => [...previous, newEvent]);

    setTagHistory((previous) =>
      [...new Set([...previous, ...selectedTags])]
    );

    // 投稿した日付のカレンダーに移動
    setSelectedDate(newDate);

    setCurrentMonth(
      new Date(
        Number(newDate.slice(0, 4)),
        Number(newDate.slice(5, 7)) - 1,
        1
      )
    );

    // フォームをリセット
    setNewTitle('');
    setNewPlace('');
    setNewTime('11:00');
    setNewTag('');
    setSelectedTags([]);

    // カレンダーに戻る
    setShowForm(false);
    setActiveTab('calendar');
  }

  // 新しい動物タグを追加
  function addAnimalTag() {
    const tag = newTag.trim();

    if (!tag || selectedTags.includes(tag)) {
      return;
    }

    setSelectedTags((previous) => [...previous, tag]);

    setTagHistory((previous) =>
      previous.includes(tag)
        ? previous
        : [...previous, tag]
    );

    setNewTag('');
  }

  // 過去のタグを選択
  function selectAnimalTag(tag) {
    if (!tag || selectedTags.includes(tag)) {
      return;
    }

    setSelectedTags((previous) => [...previous, tag]);
  }

  // 選択したタグを削除
  function removeAnimalTag(tag) {
    setSelectedTags((previous) =>
      previous.filter((item) => item !== tag)
    );
  }

  return (
    <main className="app">
      <div className="app-content">

        {/* イベント投稿画面 */}
        {showForm ? (
          <section className="post-page">

            <header className="post-header">
              <button
                type="button"
                className="back-button"
                onClick={() => setShowForm(false)}
                aria-label="戻る"
              >
                ‹
              </button>

              <span>イベントを投稿する</span>
            </header>

            <form
              className="post-form"
              onSubmit={addEvent}
            >

              {/* イベント名 */}
              <label htmlFor="event-title">
                イベント名
              </label>

              <input
                id="event-title"
                type="text"
                placeholder="イベント名を入力"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />

              {/* 場所 */}
              <label htmlFor="event-place">
                場所
              </label>

              <input
                id="event-place"
                type="text"
                placeholder="場所を入力"
                value={newPlace}
                onChange={(e) => setNewPlace(e.target.value)}
              />

              {/* 動物タグ */}
              <label htmlFor="animal-tag">
                動物のタグ付け
              </label>

              <div className="tag-input-row">
                <input
                  id="animal-tag"
                  type="text"
                  placeholder="新しくタグを入力"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAnimalTag();
                    }
                  }}
                />

                <button
                  type="button"
                  className="tag-add-button"
                  onClick={addAnimalTag}
                >
                  追加
                </button>
              </div>

              {/* 過去のタグから選択 */}
              <select
                className="tag-select"
                value=""
                onChange={(e) =>
                  selectAnimalTag(e.target.value)
                }
              >
                <option value="">
                  過去に使ったタグから選択
                </option>

                {tagHistory.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              {/* 選択中のタグ */}
              <div className="selected-tags">
                {selectedTags.map((tag) => (
                  <span
                    className="tag-chip"
                    key={tag}
                  >
                    {tag}

                    <button
                      type="button"
                      onClick={() => removeAnimalTag(tag)}
                      aria-label={`${tag}を削除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* イベント日 */}
              <label htmlFor="event-date">
                イベント日
              </label>

              <input
                id="event-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />

              {/* 時間 */}
              <label htmlFor="event-time">
                開始時間
              </label>

              <input
                id="event-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />

              {/* 投稿ボタン */}
              <button
                type="submit"
                className="post-submit"
              >
                投稿する
              </button>

            </form>
          </section>

        ) : activeTab === 'calendar' ? (

          /* カレンダー画面 */
          <>
            <section className="calendar-section">

              <header className="month-header">

                <button
                  className="month-arrow"
                  onClick={() => changeMonth(-1)}
                  aria-label="前の月"
                >
                  ‹
                </button>

                <h1>
                  {year}年{month + 1}月
                </h1>

                <button
                  className="month-arrow"
                  onClick={() => changeMonth(1)}
                  aria-label="次の月"
                >
                  ›
                </button>

              </header>

              <div className="calendar-grid">

                {weekdays.map((day, index) => (
                  <div
                    key={day}
                    className={`weekday ${
                      index === 0
                        ? 'sunday'
                        : index === 6
                        ? 'saturday'
                        : ''
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {/* 月初めの空白 */}
                {Array.from(
                  { length: firstDay },
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="day-empty"
                    />
                  )
                )}

                {/* 日付 */}
                {Array.from(
                  { length: daysInMonth },
                  (_, index) => {
                    const day = index + 1;

                    const date = formatDate(
                      new Date(year, month, day)
                    );

                    const isSelected = date === selectedDate;

                    const hasEvents = events.some(
                      (event) => event.date === date
                    );

                    return (
                      <button
                        key={day}
                        className={`day ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => selectDay(day)}
                      >
                        <span>{day}</span>

                        {hasEvents && (
                          <span className="event-dot" />
                        )}
                      </button>
                    );
                  }
                )}

              </div>
            </section>

            {/* 選択した日のイベント */}
            <section className="events-section">

              <h2>
                {selected.getMonth() + 1}月
                {selected.getDate()}日（
                {weekdays[selected.getDay()]}）のイベント
              </h2>

              {/* 天気 */}
              <div className="weather">

                {weatherLoading ? (
                  <p className="weather-summary">
                    天気予報を取得しています...
                  </p>
                ) : weatherError ? (
                  <p className="weather-summary">
                    天気予報を取得できませんでした。
                  </p>
                ) : selectedWeather && weatherInfo ? (
                  <p className="weather-summary">
                    <span className="weather-summary-icon">
                      {weatherInfo.icon}
                    </span>

                    <span>
                      天気予報：{weatherInfo.text}
                      {' '}
                      {Math.round(selectedWeather.max)}°C
                      （最低
                      {Math.round(selectedWeather.min)}°C）
                    </span>
                  </p>
                ) : (
                  <p className="weather-summary">
                    天気予報：この日の情報はありません
                  </p>
                )}

              </div>

              {/* イベント一覧 */}
              <div className="event-list">

                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event, index) => (
                    <article
                      className="event-card"
                      key={`${event.date}-${event.time}-${index}`}
                    >
                      <div className="event-time">
                        {event.time}
                      </div>

                      <div className="event-info">
                        <h3>{event.title}</h3>

                        <p>場所：{event.place}</p>

                        {event.tags?.length > 0 && (
                          <div className="event-tags">
                            {event.tags.map((tag) => (
                              <span key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="no-events">
                    この日のイベントはありません。
                  </p>
                )}

              </div>
            </section>

            {/* イベント登録ボタン */}
            <button
              className="add-button"
              onClick={openPostForm}
            >
              ＋ イベントを登録する
            </button>

          </>

        ) : (

          /* アルバム画面 */
          <section className="album-section">
            <h1>アルバム</h1>

            <p>
              動物園で撮影した写真をここに表示します。
            </p>
          </section>

        )}

      </div>

      {/* 下部メニュー：投稿画面では非表示 */}
      {!showForm && (
        <nav className="bottom-nav">

          <button
            className={activeTab === 'album' ? 'active' : ''}
            onClick={() => setActiveTab('album')}
          >
            <span className="nav-icon">▧</span>
            <span>アルバム</span>
          </button>

          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            <span className="nav-icon">▦</span>
            <span>カレンダー</span>
          </button>

        </nav>
      )}

    </main>
  );
}

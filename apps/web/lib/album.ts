export type Mood = "kiri" | "mattari";
export type MoodFilter = Mood | "both";
export type Weather = "sunny" | "rainy" | "cloudy" | "snowy";
export type SortKey = "newest" | "likes";

export type Comment = {
id: string;
name: string;
text: string;
};

export type Photo = {
id: string;
title: string;
animalName: string;
species: string;
mood: Mood;
likes: number;
  imageUrl?: string; // 画像がなければ灰色の枠を表示
createdAt: string;
description: string;
  shotDate: string; // 撮影日 "2026-10-28" の形
weather: Weather;
temperature: number;
  poster: string; // 投稿した飼育員の名前
comments: Comment[];
};

// ダミーデータ。あとでAPIに置き換える
export const photos: Photo[] = [
{
    id: "1",
    title: "この角がお気に入り",
    animalName: "たろう",
    species: "ライオン",
    mood: "mattari",
    likes: 24,
    createdAt: "2026-10-28T10:00:00+09:00",
    description: "広い部屋なのにいつもここで寝ています。",
    shotDate: "2026-10-28",
    weather: "sunny",
    temperature: 22,
    poster: "山田 武",
    comments: [
    { id: "c1", name: "ゆうき", text: "寝顔かわいい！！" },
    { id: "c2", name: "はるな", text: "今日見に行きます" },
    ],
},
{
    id: "2",
    title: "冠羽が今日もきまってます",
    animalName: "ハナ",
    species: "カンムリヅル",
    mood: "kiri",
    likes: 31,
    createdAt: "2026-10-27T14:30:00+09:00",
    description: "冠羽をふわっと広げて、今日もごきげんです。",
    shotDate: "2026-10-27",
    weather: "cloudy",
    temperature: 19,
    poster: "佐藤 花",
    comments: [{ id: "c3", name: "みなみ", text: "かっこいい！" }],
},
{
    id: "3",
    title: "朝ごはんのあと",
    animalName: "コタ",
    species: "レッサーパンダ",
    mood: "mattari",
    likes: 12,
    createdAt: "2026-10-26T09:15:00+09:00",
    description: "朝ごはんを食べたあと、ひと休みしています。",
    shotDate: "2026-10-26",
    weather: "rainy",
    temperature: 16,
    poster: "山田 武",
    comments: [],
},
];

// TODO: 天気担当のAPIにつなぐ。今は仮で晴れ
export async function getCurrentWeather(): Promise<Weather> {
return "sunny";
}

// 晴れ → キリッ、雨 → まったり、それ以外は両方
export function defaultMoodFor(weather: Weather): MoodFilter {
if (weather === "sunny") return "kiri";
if (weather === "rainy") return "mattari";
return "both";
}

// TODO: ログイン担当につなぐ。今は仮で「飼育員ではない」。確認したいときは true に
export async function isKeeper(): Promise<boolean> {
return false;
}
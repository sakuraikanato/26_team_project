import {
  getCurrentWeather as getCurrentWeatherApi,
  getPost,
  getPosts,
  type ApiPostDetail,
  type ApiPostSummary,
} from "./api-client";

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
  tags: string[]; // 動物のタグ。例：「たろう（ライオン）」
  mood: Mood;
  likes: number;
  imageUrl?: string; // 画像がなければ灰色の枠を表示
  isLiked?: boolean; // 自分がいいね済みか（APIの isLiked）。ないときは false 扱い
  createdAt: string;
  description: string;
  shotDate: string; // 撮影日 "2026-10-28" の形
  weather?: Weather; // TODO: 天気APIから入れる。ないときは表示しない
  temperature?: number;
  poster: string; // 投稿した飼育員の名前
  comments: Comment[];
};

// ダミーデータ。あとでAPIに置き換える
export const photos: Photo[] = [
  {
    id: "1",
    title: "この角がお気に入り",
    tags: ["たろう（ライオン）"],
    mood: "mattari",
    likes: 24,
    isLiked: true,
    imageUrl: "/sample/lion.jpg",
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
    tags: ["ハナ（カンムリヅル）"],
    mood: "kiri",
    likes: 31,
    imageUrl: "/sample/crane.jpg",
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
    tags: ["コタ（レッサーパンダ）"],
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

function toUiMood(mood: "kiritto" | "mattari"): Mood {
  return mood === "kiritto" ? "kiri" : "mattari";
}

function toUiWeather(
  icon: ApiPostDetail["weather"] extends infer T
    ? T extends { icon: infer I }
      ? I
      : never
    : never,
): Weather {
  if (icon === "sunny") return "sunny";
  if (icon === "rain" || icon === "thunder") return "rainy";
  if (icon === "snow") return "snowy";
  return "cloudy";
}

export function toPhoto(
  post: ApiPostSummary | ApiPostDetail,
): Photo {
  const detail = "description" in post;
  return {
    id: post.id,
    title: post.title,
    tags: post.tags,
    mood: toUiMood(post.mood),
    likes: post.likeCount,
    isLiked: post.isLiked,
    imageUrl: post.imageUrl ?? undefined,
    createdAt: post.createdAt,
    description: detail ? post.description : "",
    shotDate: post.takenAt,
    weather:
      detail && post.weather ? toUiWeather(post.weather.icon) : undefined,
    temperature: detail ? post.weather?.temperature : undefined,
    poster: post.keeper?.username ?? "飼育員",
    comments: [],
  };
}

export async function getAlbumPhotos(): Promise<Photo[]> {
  const result = await getPosts({ mood: "both", limit: 50 });
  return result.items.map(toPhoto);
}

export async function getAlbumPhoto(id: string): Promise<Photo> {
  return toPhoto(await getPost(id));
}

export async function getCurrentWeather(): Promise<Weather> {
  const { weather } = await getCurrentWeatherApi();
  return toUiWeather(weather.icon);
}

// 晴れ → キリッ、それ以外（雨・曇り・雪）→ まったり
export function defaultMoodFor(weather: Weather): MoodFilter {
  return weather === "sunny" ? "kiri" : "mattari";
}

// TODO: ログイン担当につなぐ。今は仮で「飼育員ではない」
export async function isKeeper(): Promise<boolean> {
  return false;
}

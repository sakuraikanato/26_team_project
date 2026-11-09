export const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

export const initialEvents = [
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

export interface Whethers {
  date: string,
  code: number,
  label: string,
  icon: string,
  tempMax: number,
  tempMin: number,
  precipitationProbability: number
}

export const initialWhethers: Whethers[] = [
  {
    date: "2026-11-09",
    code: 1,
    label: "晴れ",
    icon: "sun",
    tempMax: 22.5,
    tempMin: 13.2,
    precipitationProbability: 0
  },
  {
    date: "2026-11-10",
    code: 2,
    label: "晴れ時々曇り",
    icon: "partly-cloudy",
    tempMax: 21.8,
    tempMin: 12.5,
    precipitationProbability: 10
  },
  {
    date: "2026-11-11",
    code: 3,
    label: "曇り",
    icon: "cloud",
    tempMax: 19.4,
    tempMin: 11.8,
    precipitationProbability: 20
  },
  {
    date: "2026-11-12",
    code: 4,
    label: "曇り時々雨",
    icon: "cloud-drizzle",
    tempMax: 17.6,
    tempMin: 10.3,
    precipitationProbability: 60
  },
  {
    date: "2026-11-13",
    code: 5,
    label: "雨",
    icon: "cloud-rain",
    tempMax: 15.2,
    tempMin: 9.7,
    precipitationProbability: 90
  },
  {
    date: "2026-11-14",
    code: 1,
    label: "晴れ",
    icon: "sun",
    tempMax: 18.9,
    tempMin: 8.6,
    precipitationProbability: 0
  },
  {
    date: "2026-11-15",
    code: 2,
    label: "晴れ時々曇り",
    icon: "partly-cloudy",
    tempMax: 20.3,
    tempMin: 10.1,
    precipitationProbability: 10
  },
  {
    date: "2026-11-16",
    code: 6,
    label: "雷雨",
    icon: "cloud-lightning",
    tempMax: 16.8,
    tempMin: 11.2,
    precipitationProbability: 80
  },
  {
    date: "2026-11-17",
    code: 3,
    label: "曇り",
    icon: "cloud",
    tempMax: 18.1,
    tempMin: 9.4,
    precipitationProbability: 30
  },
  {
    date: "2026-11-18",
    code: 1,
    label: "晴れ",
    icon: "sun",
    tempMax: 21.2,
    tempMin: 10.8,
    precipitationProbability: 0
  }
];
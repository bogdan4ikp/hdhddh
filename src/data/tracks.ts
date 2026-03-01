export type Track = {
  id: number;
  title: string;
  artist: string;
  duration: string;
  plays: string;
  cover: string;
  audioUrl: string;
};

const AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
];

export const MOCK_TRACKS: Track[] = Array.from({ length: 100 }).map((_, i) => ({
  id: i + 1,
  title: `Royalty Free Music ${i + 1}`,
  artist: `Audio Library ${Math.floor(Math.random() * 50) + 1}`,
  duration: `${Math.floor(Math.random() * 3 + 2)}:${Math.floor(Math.random() * 50 + 10).toString().padStart(2, '0')}`,
  plays: Math.floor(Math.random() * 1000000 + 10000).toLocaleString('ru-RU'),
  cover: `https://picsum.photos/seed/track${i + 1}/200/200`,
  audioUrl: AUDIO_URLS[i % AUDIO_URLS.length]
}));

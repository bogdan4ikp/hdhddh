export const isFutureRelease = (releaseDate?: string) => {
  if (!releaseDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const release = new Date(releaseDate);
  return release > today;
};

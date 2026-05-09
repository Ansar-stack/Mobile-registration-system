export const withinFiveMinutes = (createdAt) => {
  return (Date.now() - new Date(createdAt).getTime()) < 5 * 60 * 1000;
};

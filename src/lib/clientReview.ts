export const CLIENT_REVIEW_MIN_COMMENT = 10;

export const formatReviewExpiryDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

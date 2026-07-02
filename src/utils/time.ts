const IST_TIME_ZONE = "Asia/Kolkata";

export const formatIstDate = (date: Date | string): string =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

export const formatIstDateTime = (date: Date | string): string =>
  `${new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))} IST`;

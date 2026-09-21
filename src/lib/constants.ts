export const CLUB_CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Creative",
  "Social Service",
  "Academic",
  "Entrepreneurship",
  "Literary",
] as const;

export const EVENT_TYPES = [
  "Workshop",
  "Seminar",
  "Competition",
  "Cultural",
  "Sports",
  "Meetup",
  "Hackathon",
  "Volunteering",
] as const;

export const BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Industrial & Production Engineering",
  "Biotechnology",
  "Applied Sciences",
  "Business Administration",
] as const;

export const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"] as const;

export function formatEventDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(time?: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

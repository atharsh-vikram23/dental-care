// Central place for clinic-wide scheduling rules, so the slot generator,
// booking validator, and admin dashboard all agree on what a "valid slot" is.

const OPEN_TIME = process.env.CLINIC_OPEN_TIME || "09:00";
const CLOSE_TIME = process.env.CLINIC_CLOSE_TIME || "17:00";
const SLOT_MINUTES = Number(process.env.CLINIC_SLOT_MINUTES) || 30;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatSlotLabel(totalMinutes) {
  let h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

// Generates every bookable slot label for a day, e.g. ["9:00 AM", "9:30 AM", ...]
function generateDailySlots() {
  const slots = [];
  const start = toMinutes(OPEN_TIME);
  const end = toMinutes(CLOSE_TIME);
  for (let t = start; t < end; t += SLOT_MINUTES) {
    slots.push(formatSlotLabel(t));
  }
  return slots;
}

module.exports = {
  OPEN_TIME,
  CLOSE_TIME,
  SLOT_MINUTES,
  generateDailySlots,
};

/**
 * Solunar calculations using simplified Meeus astronomical algorithms.
 * No external API needed — pure math.
 *
 * References:
 *  - Jean Meeus, "Astronomical Algorithms" 2nd ed.
 *  - USNO solar/lunar algorithms (simplified)
 *  - Solunar theory by John Alden Knight (1936)
 */

import type { SolunarData } from '../types';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── Julian Day ────────────────────────────────────────────────────────────

function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;

  if (m <= 2) {
    return julianDay(y - 1, m + 12, d);
  }
  return julianDay(y, m, d);
}

function julianDay(y: number, m: number, d: number): number {
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function jdToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const dd = Math.floor(365.25 * c);
  const e = Math.floor((b - dd) / 30.6001);

  const dayFrac = b - dd - Math.floor(30.6001 * e) + f;
  const day = Math.floor(dayFrac);
  const hourFrac = (dayFrac - day) * 24;
  const hour = Math.floor(hourFrac);
  const minFrac = (hourFrac - hour) * 60;
  const min = Math.floor(minFrac);
  const sec = Math.floor((minFrac - min) * 60);

  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  return new Date(Date.UTC(year, month - 1, day, hour, min, sec));
}

// ─── Solar position (Meeus Ch. 25, low-precision) ─────────────────────────

function solarPosition(jd: number): { ra: number; dec: number; eqTime: number } {
  const T = (jd - 2451545.0) / 36525;
  const L0 = (280.46646 + 36000.76983 * T) % 360;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T ** 2) % 360;
  const Mrad = M * DEG;

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  const sunLon = L0 + C;
  const sunLonRad = sunLon * DEG;

  const e = 0.016708634 - 0.000042037 * T;
  const obliq = (23.439291111 - 0.013004167 * T) * DEG;

  const ra = Math.atan2(Math.cos(obliq) * Math.sin(sunLonRad), Math.cos(sunLonRad)) * RAD;
  const dec = Math.asin(Math.sin(obliq) * Math.sin(sunLonRad)) * RAD;

  // Equation of time (minutes)
  const y = Math.tan(obliq / 2) ** 2;
  const L0rad = L0 * DEG;
  const Mrad2 = M * DEG;
  const eqTime =
    4 *
    RAD *
    (y * Math.sin(2 * L0rad) -
      2 * e * Math.sin(Mrad2) +
      4 * e * y * Math.sin(Mrad2) * Math.cos(2 * L0rad) -
      0.5 * y ** 2 * Math.sin(4 * L0rad) -
      1.25 * e ** 2 * Math.sin(2 * Mrad2));

  return { ra, dec, eqTime };
}

function sunriseSetJD(jd: number, lat: number, lon: number, rising: boolean): number {
  const { dec, eqTime } = solarPosition(jd);
  const decRad = dec * DEG;
  const latRad = lat * DEG;

  // Solar zenith at rise/set = 90.833° (accounts for refraction + solar disk)
  const cosH =
    (Math.cos(90.833 * DEG) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  if (cosH < -1) return NaN; // midnight sun
  if (cosH > 1) return NaN;  // polar night

  const H = Math.acos(cosH) * RAD;
  const noon = (720 - 4 * lon - eqTime) / 1440; // fraction of day UTC

  if (rising) {
    return Math.floor(jd) - 0.5 + noon - H / 360;
  } else {
    return Math.floor(jd) - 0.5 + noon + H / 360;
  }
}

// ─── Lunar position (Meeus Ch. 47, truncated) ──────────────────────────────

function lunarPosition(jd: number): { ra: number; dec: number; lon: number } {
  const T = (jd - 2451545.0) / 36525;

  const Lp = (218.3164477 + 481267.88123421 * T) % 360;
  const D = (297.8501921 + 445267.1114034 * T) % 360;
  const M = (357.5291092 + 35999.0502909 * T) % 360;
  const Mp = (134.9633964 + 477198.8675055 * T) % 360;
  const F = (93.272095 + 483202.0175233 * T) % 360;

  const Drad = D * DEG;
  const Mrad = M * DEG;
  const Mprad = Mp * DEG;
  const Frad = F * DEG;

  let lon =
    Lp +
    6.289 * Math.sin(Mprad) +
    1.274 * Math.sin(2 * Drad - Mprad) +
    0.658 * Math.sin(2 * Drad) -
    0.214 * Math.sin(2 * Mprad) -
    0.186 * Math.sin(Mrad) -
    0.114 * Math.sin(2 * Frad) +
    0.059 * Math.sin(2 * Drad - 2 * Mprad) +
    0.057 * Math.sin(2 * Drad - Mrad - Mprad) +
    0.053 * Math.sin(2 * Drad + Mprad) +
    0.046 * Math.sin(2 * Drad - Mrad) +
    0.041 * Math.sin(Mprad - Mrad) -
    0.035 * Math.sin(Drad) -
    0.031 * Math.sin(Mprad + Mrad) -
    0.015 * Math.sin(2 * Frad - 2 * Drad) +
    0.011 * Math.sin(Drad - Mprad);

  const lat =
    5.128 * Math.sin(Frad) +
    0.28 * Math.sin(Mprad + Frad) -
    0.28 * Math.sin(Frad - Mprad) -
    0.17 * Math.sin(2 * Drad - Frad);

  const obliq = (23.439291111 - 0.013004167 * T) * DEG;
  const lonRad = lon * DEG;
  const latRad = lat * DEG;

  const ra = Math.atan2(
    Math.sin(lonRad) * Math.cos(obliq) - Math.tan(latRad) * Math.sin(obliq),
    Math.cos(lonRad)
  ) * RAD;

  const dec = Math.asin(
    Math.sin(latRad) * Math.cos(obliq) + Math.cos(latRad) * Math.sin(obliq) * Math.sin(lonRad)
  ) * RAD;

  return { ra: ((ra % 360) + 360) % 360, dec, lon: ((lon % 360) + 360) % 360 };
}

function moonPhase(jd: number): number {
  // Synodic month = 29.53058868 days
  const k = (jd - 2451550.09766) / 29.53058868;
  return ((k % 1) + 1) % 1; // 0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter
}

function moonPhaseName(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Find moonrise or moonset for a given date.
 * Uses iterative method: step through the day in 1-hour increments looking
 * for the hour when the moon crosses the horizon, then bisect.
 */
function moonRiseSetJD(
  jdNoon: number,
  lat: number,
  lon: number,
  rising: boolean
): number {
  // horizon altitude: 0.5° (refraction) + 0.125° (angular radius) ≈ 0.625°
  const altHorizon = 0.625;
  const latRad = lat * DEG;

  function lunarAlt(jd: number): number {
    const { ra, dec } = lunarPosition(jd);
    // Local sidereal time
    const T = (jd - 2451545.0) / 36525;
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T ** 2;
    const LST = ((theta0 + lon) % 360 + 360) % 360; // local sidereal time in degrees
    const H = (LST - ra) * DEG; // hour angle
    const decRad = dec * DEG;
    return (
      Math.asin(
        Math.sin(latRad) * Math.sin(decRad) +
          Math.cos(latRad) * Math.cos(decRad) * Math.cos(H)
      ) * RAD
    );
  }

  const startJD = jdNoon - 0.5; // start of UT day
  let prevAlt = lunarAlt(startJD);
  let resultJD = NaN;

  for (let h = 1; h <= 24; h++) {
    const jd = startJD + h / 24;
    const alt = lunarAlt(jd);

    const crossed = rising
      ? prevAlt < altHorizon && alt >= altHorizon
      : prevAlt >= altHorizon && alt < altHorizon;

    if (crossed) {
      // Bisect to find exact crossing
      let lo = jd - 1 / 24;
      let hi = jd;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const midAlt = lunarAlt(mid);
        if (rising ? midAlt < altHorizon : midAlt >= altHorizon) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      resultJD = (lo + hi) / 2;
      break;
    }
    prevAlt = alt;
  }

  return resultJD;
}

// ─── Solunar Period Calculation ─────────────────────────────────────────────

/**
 * Solunar theory (J.A. Knight):
 *  - Major periods: 2-hour windows centered on moonrise, moonset, moon transit (overhead), moon underfoot
 *    (traditionally 4 major periods per day, but standard solunar uses moonrise/moonset + overhead/underfoot)
 *  - Minor periods: 1-hour windows at the midpoints between major periods
 *
 * Modern solunar:
 *  - 2 major periods: when moon is directly overhead (upper transit) or underfoot (lower transit)
 *  - 2 minor periods: moonrise and moonset
 * Some sources use moonrise/moonset as major and overhead/underfoot as minor.
 * We use the Knight convention: overhead/underfoot = major, rise/set = minor.
 */
function solunarPeriods(
  moonriseJD: number,
  moonsetJD: number,
  jdDate: number
): { major: [string, string][]; minor: [string, string][] } {
  // Moon transit (overhead) = midpoint between moonrise and moonset
  // Moon underfoot = transit ± 12h (lunar day ≈ 24h 50min, but approximate as +12h)
  const lunarDay = 24.8412 / 24; // JD units

  // Upper transit (overhead): between rise and set
  const upperTransit = isNaN(moonriseJD) || isNaN(moonsetJD)
    ? jdDate
    : (moonriseJD + moonsetJD) / 2;

  // Lower transit (underfoot): ~12h from upper
  const lowerTransit = upperTransit + 12 / 24;

  const majorDuration = 2 / 24; // 2 hours
  const minorDuration = 1 / 24; // 1 hour

  function jdToHHMM(jd: number): string {
    if (isNaN(jd)) return '--:--';
    const d = jdToDate(jd);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  const major: [string, string][] = [
    [
      jdToHHMM(upperTransit - majorDuration / 2),
      jdToHHMM(upperTransit + majorDuration / 2),
    ],
    [
      jdToHHMM(lowerTransit - majorDuration / 2),
      jdToHHMM(lowerTransit + majorDuration / 2),
    ],
  ];

  const minor: [string, string][] = isNaN(moonriseJD) || isNaN(moonsetJD)
    ? []
    : [
        [
          jdToHHMM(moonriseJD - minorDuration / 2),
          jdToHHMM(moonriseJD + minorDuration / 2),
        ],
        [
          jdToHHMM(moonsetJD - minorDuration / 2),
          jdToHHMM(moonsetJD + minorDuration / 2),
        ],
      ];

  return { major, minor };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute all solunar data for a given date and location.
 * @param dateStr "YYYY-MM-DD" in local time
 * @param lat latitude in decimal degrees
 * @param lon longitude in decimal degrees (negative for West)
 * @param utcOffsetHours e.g. -5 for EST, -4 for EDT
 */
export function computeSolunar(
  dateStr: string,
  lat: number,
  lon: number,
  utcOffsetHours: number = -5
): SolunarData {
  // Build a UTC noon JD for the date
  const [y, mo, d] = dateStr.split('-').map(Number);
  const noonUTC = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const jdNoon = dateToJD(noonUTC);

  // Sunrise / sunset
  const sunriseJD = sunriseSetJD(jdNoon, lat, lon, true);
  const sunsetJD = sunriseSetJD(jdNoon, lat, lon, false);

  // Moonrise / moonset (search over UT day)
  const jdDayStart = dateToJD(new Date(Date.UTC(y, mo - 1, d, 0, 0, 0)));
  const moonriseJD = moonRiseSetJD(jdNoon, lat, lon, true);
  const moonsetJD = moonRiseSetJD(jdNoon, lat, lon, false);

  // Moon phase
  const phase = moonPhase(jdNoon);

  // Solunar periods (computed in UTC, offset for display)
  const { major, minor } = solunarPeriods(moonriseJD, moonsetJD, jdNoon);

  function formatJDLocal(jd: number): string {
    if (isNaN(jd)) return '--:--';
    const utcDate = jdToDate(jd);
    // Apply UTC offset for local display
    const localMs = utcDate.getTime() + utcOffsetHours * 3600 * 1000;
    const local = new Date(localMs);
    const h = local.getUTCHours().toString().padStart(2, '0');
    const m = local.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  function offsetPeriods(periods: [string, string][]): [string, string][] {
    return periods.map(([s, e]) => [
      offsetHHMM(s, utcOffsetHours),
      offsetHHMM(e, utcOffsetHours),
    ]);
  }

  return {
    sunrise: formatJDLocal(sunriseJD),
    sunset: formatJDLocal(sunsetJD),
    moonrise: formatJDLocal(moonriseJD),
    moonset: formatJDLocal(moonsetJD),
    moonPhase: phase,
    moonPhaseName: moonPhaseName(phase),
    majorPeriods: offsetPeriods(major),
    minorPeriods: offsetPeriods(minor),
  };
}

/** Add UTC offset to an HH:mm string */
function offsetHHMM(hhmm: string, offsetHours: number): string {
  if (hhmm === '--:--') return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const totalMin = h * 60 + m + offsetHours * 60;
  const wrapped = ((totalMin % 1440) + 1440) % 1440;
  const oh = Math.floor(wrapped / 60).toString().padStart(2, '0');
  const om = (wrapped % 60).toString().padStart(2, '0');
  return `${oh}:${om}`;
}

/** Get UTC offset in hours for a given timezone name */
export function getUtcOffset(timezoneName: string): number {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneName,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    const match = tzPart.match(/GMT([+-]\d+(?::\d+)?)?/);
    if (!match || !match[1]) return 0;
    const [h, m = '0'] = match[1].split(':');
    return parseInt(h) + (parseInt(m) / 60) * Math.sign(parseInt(h));
  } catch {
    return -5; // Default EST
  }
}

/** Estimate local UTC offset from longitude (rough: 15° per hour) */
export function lonToUtcOffset(lon: number): number {
  return Math.round(lon / 15);
}

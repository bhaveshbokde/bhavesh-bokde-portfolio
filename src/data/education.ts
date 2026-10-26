import type { Education } from "./types";

/**
 * Education.
 *
 * ## Adding an entry
 *
 *   {
 *     id: "some-course",
 *     degree: "Master of Technology",
 *     field: "Computer Science",
 *     institution: "Example Institute",
 *     affiliation: "Example University",   // optional
 *     location: "Pune, India",             // optional
 *     startYear: "2027",
 *     endYear: "2029",
 *     details: ["Anything worth adding."], // optional
 *   }
 *
 * No grades, percentages or honours are shown unless you put them in `details`
 * yourself.
 */
export const education: Education[] = [
  {
    id: "be-cse-rtmnu",
    degree: "Bachelor of Engineering",
    field: "Computer Science & Engineering",
    institution: "Govindrao Wanjari College of Engineering & Technology",
    affiliation: "RTMNU (Rashtrasant Tukadoji Maharaj Nagpur University)",
    location: "Nagpur, India",
    startYear: "2013",
    endYear: "2017",
    order: 1,
  },
];

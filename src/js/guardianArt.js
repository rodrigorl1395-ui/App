const ART = {
  raposa: '<path d="M14 28 11 8l15 10a17 17 0 0 1 12 0L53 8l-3 20c2 14-6 25-18 25S12 42 14 28Z" fill="#f47b3d"/><path d="M21 35q11-10 22 0-3 12-11 12T21 35Z" fill="#fff1df"/><circle cx="25" cy="30" r="2"/><circle cx="39" cy="30" r="2"/>',
  axolote: '<path d="M16 32c0-12 7-19 16-19s16 7 16 19c0 13-7 20-16 20s-16-7-16-20Z" fill="#efa2bd"/><path d="m19 23-11-9 5 17m32-8 11-9-5 17M22 18 15 5l13 9m14 4 7-13-13 9" fill="#e77ca2"/><ellipse cx="32" cy="41" rx="11" ry="6" fill="#ffd9e5"/><circle cx="26" cy="30" r="2"/><circle cx="38" cy="30" r="2"/>',
  capivara: '<path d="M12 36c0-12 9-21 21-21 8 0 14 4 17 11 10 0 12 8 7 15-6 8-17 10-28 8-11-2-17-6-17-13Z" fill="#9b714e"/><path d="m43 21 9-5-3 12" fill="#bc895f"/><ellipse cx="29" cy="43" rx="16" ry="9" fill="#bd8a63"/><circle cx="45" cy="32" r="2"/>',
  vagalume: '<path d="M32 12c9 0 14 9 14 20s-5 20-14 20-14-9-14-20 5-20 14-20Z" fill="#f1d45e"/><path d="m20 25-13-9 5 18m25-9 13-9-5 18M25 17 20 6l11 9m8 2 5-11-11 9" fill="#afcfe2"/><ellipse cx="32" cy="42" rx="7" ry="5" fill="#fff1a3"/><circle cx="27" cy="30" r="2"/><circle cx="37" cy="30" r="2"/>',
  salamandra: '<path d="M14 36c0-13 8-23 18-23s18 10 18 23c0 12-8 18-18 18s-18-6-18-18Z" fill="#d94c43"/><path d="m18 27-11-10 4 17m32-7 11-10-4 17M24 17 20 5l11 10m9 2 4-12-11 10" fill="#f49a72"/><path d="M22 40q10-10 20 0-3 10-10 10t-10-10Z" fill="#ffb14d"/><circle cx="26" cy="30" r="2"/><circle cx="38" cy="30" r="2"/>',
  tartaruga: '<path d="M13 36c0-13 8-22 19-22s19 9 19 22c0 12-8 18-19 18s-19-6-19-18Z" fill="#4fb3c9"/><path d="m19 26-12-9 5 17m27-8 12-9-5 17" fill="#75d4d4"/><path d="M20 36q12-19 24 0-12 18-24 0Z" fill="#276b72"/><path d="M32 20v31M21 36h22" stroke="#84d9c3" stroke-width="2"/><circle cx="25" cy="30" r="2"/><circle cx="39" cy="30" r="2"/>',
  tatu: '<path d="M13 36c0-13 8-21 19-21s19 8 19 21c0 12-8 18-19 18s-19-6-19-18Z" fill="#ae875f"/><path d="m18 26-11-9 4 17m32-8 11-9-4 17" fill="#c6a078"/><path d="M17 31h30M15 39h34M20 47h24" stroke="#6e503d" stroke-width="4"/><circle cx="25" cy="30" r="2"/><circle cx="39" cy="30" r="2"/>',
  ourico: '<path d="M13 37c0-14 9-23 19-23s19 9 19 23c0 12-8 18-19 18s-19-6-19-18Z" fill="#79996f"/><path d="m18 22-3-15 11 10m2-9 4-7 4 10m5 1 8-13 0 17" fill="#a9c491"/><ellipse cx="32" cy="41" rx="14" ry="12" fill="#d8b796"/><circle cx="26" cy="34" r="2"/><circle cx="39" cy="34" r="2"/>',
  coruja: '<path d="M14 36c0-13 7-22 18-22s18 9 18 22c0 12-8 18-18 18s-18-6-18-18Z" fill="#a99bd2"/><path d="m16 27-10-13 14 6m28 7 10-13-14 6" fill="#c9bbed"/><circle cx="27" cy="32" r="7" fill="#f3e5c8"/><circle cx="37" cy="32" r="7" fill="#f3e5c8"/><circle cx="27" cy="32" r="2"/><circle cx="37" cy="32" r="2"/><path d="m32 36 3 4h-6Z" fill="#d89257"/>',
  lince: '<path d="M14 35c0-13 8-21 18-21s18 8 18 21c0 12-8 18-18 18s-18-6-18-18Z" fill="#d9994f"/><path d="m17 23-8-16 14 11m24 5 8-16-14 11" fill="#e8b96c"/><path d="M19 26q4-10 13-1 9-9 13 1-3 16-13 16T19 26Z" fill="#f1c878" opacity=".7"/><circle cx="26" cy="31" r="2"/><circle cx="38" cy="31" r="2"/>',
  lontra: '<path d="M15 34c0-12 7-21 17-21s17 9 17 21c0 13-8 20-17 20s-17-7-17-20Z" fill="#b5793f"/><path d="m19 18-3-9 10 6m22 3 3-9-10 6" fill="#8f5c2c"/><ellipse cx="32" cy="41" rx="12" ry="9" fill="#f2d9a8"/><path d="M20 39h8m8 0h8" stroke="#8f5c2c" stroke-width="1.2" opacity=".6"/><circle cx="32" cy="36" r="2.6" fill="#4a3728"/><circle cx="26" cy="29" r="2"/><circle cx="38" cy="29" r="2"/>',
  cervo: '<path d="M16 36c0-13 7-22 16-22s16 9 16 22c0 12-7 18-16 18s-16-6-16-18Z" fill="#a98a6b"/><path d="m21 17-5-13 4 2 3 6-2-9 4 2 3 11m12 1 5-13-4 2-3 6 2-9-4 2-3 11" fill="#e6d3b3"/><ellipse cx="32" cy="43" rx="10" ry="7" fill="#e6d3b3"/><circle cx="32" cy="40" r="2.4" fill="#3e2f24"/><circle cx="26" cy="31" r="2"/><circle cx="38" cy="31" r="2"/>'
};

export function createGuardianArt(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("class", "guardian-art");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = ART[id] || ART.raposa;
  return svg;
}

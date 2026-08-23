/* LATEST_DATA — most recent EV sales snapshot, H1 2026 (Jan–Jun)
   Compiled 2026-08-23 from company reports and registration bodies.
   Half-year figures — NOT comparable to the annual series in ev-data.js / oem-data.js.
   Sources: Tesla IR quarterly delivery reports; BYD monthly sales reports (via CnEVPost /
   CleanTechnica); Volkswagen Group H1 2026 deliveries press release; BMW Group H1 2026 sales
   release; Mercedes-Benz Group Q1/Q2 2026 sales reports; CAAM (China); ACEA (EU);
   Cox Automotive / Kelley Blue Book (US). */
const LATEST_DATA = {
  retrieved: "2026-08-23",
  period: "H1 2026 (Jan\u2013Jun)",
  oem: [
    { name: "BYD \u00b7 passenger NEV", h1: 1808511, yoy: -15.9, scope: "BEV+PHEV sales \u00b7 derived: reported Jan\u2013Jul cumulative minus July", note: "BEV \u221215.2% / PHEV \u221216.5% YoY; June turned positive +5.2% (201,472 BEV / 195,820 PHEV)" },
    { name: "Tesla \u00b7 BEV deliveries", h1: 838149, yoy: null, scope: "Global deliveries, all BEV \u00b7 Q1 358,023 + Q2 480,126", note: "Q2 +25% YoY \u2014 record quarter, first delivery growth in two years" },
    { name: "Volkswagen Group \u00b7 BEV", h1: 438463, yoy: -5.8, scope: "BEV deliveries to customers", note: "Europe +8.4% (377K); US \u221268.8%; China \u221247.9% \u00b7 PHEV/EREV +27% to 245.5K" },
    { name: "BMW Group \u00b7 BEV", h1: 204295, yoy: -7.4, scope: "BEV deliveries (BMW, MINI, Rolls-Royce)", note: "Q2 +5.2% on new iX3; Europe Q2 +38%" },
    { name: "Mercedes-Benz Cars \u00b7 BEV", h1: 97152, yoy: 28.4, scope: "BEV sales, Cars division \u00b7 Q1 44,300 + Q2 52,852", note: "Q2 +51% YoY; Europe Q2 +87% on electric CLA/GLC" }
  ],
  markets: [
    { name: "China \u00b7 NEV incl. exports", h1: 7446000, yoy: 7.3, share: "49.6%", note: "June share record 58.5%; domestic-only 5.09M (\u221213.4%); NEV exports 2.36M (+120%)" },
    { name: "EU \u00b7 BEV", h1: 1220890, yoy: null, share: "20.7%", note: "Up from 15.6% in H1 2025; plus 577,735 PHEV (9.8% share) \u00b7 Germany BEV +48%, France +62.9%" },
    { name: "United Kingdom \u00b7 BEV", h1: null, yoy: 14.5, share: null, note: "Q1 2026: 137,614 \u2014 largest European BEV market in Q1; H1 figure not yet published" },
    { name: "Norway \u00b7 BEV", h1: null, yoy: -7.0, share: null, note: "Q1 2026: 26,617 \u2014 near-saturated market; H1 figure not yet published" },
    { name: "United States \u00b7 BEV", h1: null, yoy: -27.0, share: "5.8% (Q1)", note: "Q1 2026: 216,399 \u2014 reset after federal tax-credit expiry; Q2 count not yet released" }
  ]
};

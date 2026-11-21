const ALLOWED_TABLES = ["transaction", "user", "product"] as const;

export type StatsTable = (typeof ALLOWED_TABLES)[number];

export const statsSQLQuery = (
  table: StatsTable,
  year?: number,
): string =>
  `SELECT MONTH(createdAt) AS month, COUNT(*) AS count FROM ${table} WHERE YEAR(createdAt) = ${year ?? 0} GROUP BY MONTH(createdAt) ORDER BY month;`;

export const transactionsCountSQlQuery = (year: number): string =>
  `SELECT COUNT(*) AS count FROM transaction WHERE YEAR(createdAt) = ${year};`;

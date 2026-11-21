/**
 * Adaptateur de données minimal en attendant la configuration de Prisma.
 * Les routes API gardent la même surface d'appel (`prisma.*`) mais
 * renvoient des données vides tant que la base n'est pas branchée.
 */

type DecimalLike = { toNumber: () => number };

export interface ProductRecord {
  id: number;
  name: string;
  description: string;
  price: DecimalLike;
  image?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface UserRecord {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface CategoryRecord {
  id: string;
  name: string;
  products?: ProductRecord[];
  [key: string]: unknown;
}

export interface TransactionRecord {
  id: string;
  amount: DecimalLike;
  createdAt: Date;
  [key: string]: unknown;
}

export interface AdminInfoRecord {
  id: string;
  [key: string]: unknown;
}

interface FindManyArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc" | Record<string, unknown>>;
  take?: number;
  skip?: number;
}

interface FindUniqueArgs {
  where: Record<string, unknown>;
  include?: Record<string, unknown>;
}

interface ModelDelegate<T> {
  findMany: (args?: FindManyArgs) => Promise<T[]>;
  findUnique: (args: FindUniqueArgs) => Promise<T | null>;
  count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
}

const createDelegate = <T,>(): ModelDelegate<T> => ({
  findMany: async () => [],
  findUnique: async () => null,
  count: async () => 0,
});

export const prisma = {
  product: createDelegate<ProductRecord>(),
  user: createDelegate<UserRecord>(),
  category: createDelegate<CategoryRecord>(),
  transaction: createDelegate<TransactionRecord>(),
  adminInfo: createDelegate<AdminInfoRecord>(),
  $queryRawUnsafe: async (query: string, ...values: unknown[]): Promise<unknown> => {
    void query;
    void values;
    return [];
  },
};

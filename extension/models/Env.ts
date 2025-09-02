type Product = 'PCMS';

type Env = {
	product: Product;
};

export const env: Env = {
	product: 'PCMS',
} as const;

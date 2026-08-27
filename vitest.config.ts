import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
  },
});

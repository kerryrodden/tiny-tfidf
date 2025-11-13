import terser from '@rollup/plugin-terser';

export default [
  // UMD build (unminified)
  {
    input: 'index.js',
    output: {
      file: 'dist/tiny-tfidf.js',
      format: 'umd',
      name: 'TinyTFIDF',
      exports: 'named'
    }
  },
  // UMD build (minified)
  {
    input: 'index.js',
    output: {
      file: 'dist/tiny-tfidf.min.js',
      format: 'umd',
      name: 'TinyTFIDF',
      exports: 'named'
    },
    plugins: [terser()]
  }
];

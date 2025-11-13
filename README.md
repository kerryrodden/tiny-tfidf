# tiny-tfidf
![npm](https://img.shields.io/npm/v/tiny-tfidf.svg)

Minimal implementations of a couple of classic text analysis tools (TF-IDF and cosine similarity). Everything is done in memory so this library is not suitable for large-scale use. Instead, the goal is to create something simple that can be used to explain or experiment with the techniques, using a small set of documents. For a detailed and interactive explanation, see this [Observable notebook](https://observablehq.com/@kerryrodden/introduction-to-text-analysis-with-tf-idf).

The term weighting scheme is BM25, as described in this [technical report](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf) by Stephen Robertson and Karen Spärck Jones.

A basic set of English stopwords is included, and you can specify your own list of stopwords to add. In the interest of keeping this "tiny" (and fast enough to run in the browser) there are some useful things that I didn't implement, most notably:
- phrases (bigrams, trigrams, etc), e.g. "proof of concept"
- stemming or lemmatizing, e.g. reducing "concept" and "concepts" to the same root

I am open to adding either if there's a tiny way to do it!

## Usage

```js
import { Corpus } from "tiny-tfidf";

const corpus = new Corpus(
  ["document1", "document2", "document3"],
  [
    "This is test document number 1. It is quite a short document.",
    "This is test document 2. It is also quite short, and is a test.",
    "Test document number three is a bit different and is also a tiny bit longer."
  ]
);

// print top terms for document 3
console.log(corpus.getTopTermsForDocument("document3"));

// result
[
  [ 'bit', 1.9939850399669656 ],
  [ 'three', 1.3113595307890855 ],
  [ 'different', 1.3113595307890855 ],
  [ 'tiny', 1.3113595307890855 ],
  [ 'longer', 1.3113595307890855 ],
  [ 'number', 0.6556797653945428 ],
  [ 'also', 0.6556797653945428 ],
  [ 'test', 0.2721316901570901 ],
  [ 'document', 0.2721316901570901 ]
]
```

### With options (v1.0+)

```js
const corpus = new Corpus(
  ["document1", "document2"],
  ["First document text", "Second document text"],
  {
    useDefaultStopwords: true,
    customStopwords: ['custom', 'words'],
    K1: 2.0,
    b: 0.75
  }
);
```

For many more usage examples, see this [Observable notebook](https://observablehq.com/@kerryrodden/introduction-to-text-analysis-with-tf-idf).

### With Node.js

Disclaimer: this is an ES6 module and is mostly intended for use in the browser, rather than with Node.js ([more background on ES6 modules and Node](https://github.com/nodejs/modules/blob/master/doc/announcement.md#es-module-code-in-packages)).

Example with Node v12.6.0+ :

```sh
node --experimental-modules --es-module-specifier-resolution=node test.js
```

### In the browser

For browser usage, UMD bundles are available in the `dist/` folder (after running `npm run build`):

```html
<script src="dist/tiny-tfidf.min.js"></script>
<script>
  const corpus = new TinyTFIDF.Corpus(
    ["doc1", "doc2"],
    ["First document", "Second document"]
  );
  console.log(corpus.getTerms());
</script>
```

Or use with `importScripts()` in a Web Worker.

## Migration from v0.9 to v1.0

The main change is that the `Corpus` constructor now accepts an optional options object as the third parameter, which is cleaner and more extensible. However, the v0.9 API is still supported for backward compatibility.

**Old API (still works):**
```js
new Corpus(names, texts, useDefaultStopwords, customStopwords, K1, b)
```

**New API (recommended):**
```js
new Corpus(names, texts, { useDefaultStopwords, customStopwords, K1, b })
```

Other changes:
- Tokenization now preserves alphanumeric terms like "2nd" (previously became "nd")
- Empty string documents are now handled gracefully
- New method: `addDocument(identifier, text)` for dynamic corpus growth

## API (v1.0)

### `Corpus` class

This is the main class that you will use directly. It takes care of creating a `Document` for every text and also manages `Stopwords` for the collection. It calculates term frequencies, term weights, and term vectors, and can return results for a given query.
- `constructor(names, texts, options = {})`: `names` and `texts` are parallel arrays containing the document identifiers and the full texts of each document; `options` is an optional object with properties:
  - `useDefaultStopwords` (default: `true`) - whether to use the built-in stopword list
  - `customStopwords` (default: `[]`) - additional stopwords to add or use exclusively
  - `K1` (default: `2.0`) - BM25 term frequency tuning constant (higher values increase influence)
  - `b` (default: `0.75`) - BM25 document length tuning constant (0-1 range; 1 = repetitive docs, 0 = multitopic docs)
  - Note: The v0.9 signature `constructor(names, texts, useDefaultStopwords, customStopwords, K1, b)` is still supported for backward compatibility
- `getTerms()`: returns an array containing the unique terms used in the corpus (excluding stopwords)
- `getCollectionFrequency(term)`: returns the number of documents in the collection that contain the given term
- `getDocument(identifier)`: returns the `Document` object for the given `identifier`
- `getDocumentIdentifiers()`: returns an array of all identifiers in the corpus
- `getCommonTerms(identifier1, identifier2, maxTerms = 10)`: returns an array of the terms that the documents with these two identifiers have in common; each array entry is a pair of a term and a score, and the array is sorted in descending order by the score, with a maximum length of `maxTerms` (which is optional and defaults to 10)
- `getCollectionFrequencyWeight(term)`: returns the collection frequency weight (or inverse document frequency) for the given `term`
- `getDocumentVector(identifier)`: returns a `Map` from terms to their corresponding combined (TF-IDF) weights, for the document with the given `identifier` (this is used by the `Similarity` class)
- `getTopTermsForDocument(identifier, maxTerms = 30)`: returns an array containing the terms with the highest combined (TF-IDF) weights for the document with the given `identifier`; each array entry is a pair of a term and a weight, and the array is sorted in descending order by the weight, with a maximum length of `maxTerms` (which is optional and defaults to 30)
- `getResultsForQuery(query)`: returns an array representing the highest scoring documents for the given `query`; each array entry is a pair of a document identifier and a score, and the array is sorted in descending order by the score. The score for a document is the total combined weight of each query term that appears in the document.
- `getStopwords()`: returns the `Stopwords` instance that is being used by this corpus (for inspection or debugging)
- `addDocument(identifier, text)`: dynamically adds a new document to the corpus; returns `true` if successful, `false` if the identifier already exists. All cached calculations are automatically invalidated and recalculated on next access.

The other methods in the class (whose names start with `_calculate`) are intended for internal use.

### `Document` class

This is used by the `Corpus` class for each of the given texts. It is independent of any stopword list or term weights (which are managed at the corpus level) and only maintains the document-level term frequencies. Terms can contain letters and numbers (e.g., "2nd"). Single letters are filtered out except for 'i' and 'a' (which are handled as stopwords at the corpus level). Pure numeric tokens (e.g., "123") are also filtered out.
- `constructor(text)`: expects a single one of the texts originally passed into `Corpus`
- `getTermFrequency(term)`: returns a count of how often the given term appears in this document
- `getText()`: returns a string containing the full text of this document (e.g. for display)
- `getLength()`: returns the total number of terms in the document (including stopwords)
- `getUniqueTerms()`: returns an array of the unique terms that appear in the document (including stopwords)

The other method, `_calculateTermFrequencies`, is intended for internal use.

### `Stopwords` class

- `constructor(useDefaultStopwords = true, customStopwords = [])`: `useDefaultStopwords` and `customStopwords` are optional parameters, as specified in the constructor for `Corpus`, which control whether the default stopword list should be used, and to specify any custom stopwords. If the default stopword list is to be used, any custom stopwords are added to that list; if not, the custom stopwords are used instead of the default list.
- `includes(term)`: returns `true` if the current stopword list contains the given `term`, or `false` otherwise
- `getStopwordList()`: returns an array of the stopword list currently in use (for inspection or debugging)

### `Similarity` class

An optional addition: once you have a `Corpus` you can use `Similarity` to calculate the pairwise similarity between the documents in the corpus, resulting in a distance matrix (distance = 1 - similarity).
- `constructor(corpus)`: expects an instance of `Corpus`
- `getDistanceMatrix()`: returns an object with properties `identifiers` (an array of identifiers for the items in the matrix) and `matrix` (an array of arrays, where the values represent distances between items; distance is 1.0 - similarity, so 0 = identical)

There is also a static method, `cosineSimilarity(vector1, vector2)`, which calculates the similarity between a pair of documents (as [the cosine of the angle between their vectors](https://en.wikipedia.org/wiki/Cosine_similarity)). Each vector is represented as an ES6 `Map` from each term to its combined (TF-IDF) weight for the corresponding document. It is currently only used to calculate individual entries in the distance matrix. The other method, `_calculateDistanceMatrix`, is intended for internal use.

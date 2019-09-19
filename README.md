# tiny-tfidf
![npm](https://img.shields.io/npm/v/tiny-tfidf.svg)

Minimal implementations of a couple of classic text analysis tools (TF-IDF and cosine similarity). The goal is to create something simple that can be used to explain or experiment with the techniques, using a small set of documents.

The term weighting scheme is BM25, as described in this [technical report](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf) by Stephen Robertson and Karen Spärck Jones.

A basic set of English stopwords is included, and you can specify your own list of stopwords to add. In the interest of keeping this "tiny" (and fast enough to run in the browser) there are some useful things that I didn't implement, most notably:
- phrases (bigrams, trigrams, etc), e.g. "proof of concept"
- stemming or lemmatizing, e.g. reducing "concept" and "concepts" to the same root

I am open to adding either if there's a tiny way to do it!

## Usage

Note: I'm still actively developing this code (and documentation), and the API is likely to change/evolve up until version 1.0.

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
  [ 'bit', 1.773167206083581 ],
  [ 'three', 1.1913467165874059 ],
  [ 'different', 1.1913467165874059 ],
  [ 'tiny', 1.1913467165874059 ],
  [ 'longer', 1.1913467165874059 ],
  [ 'number', 0.5956733582937029 ],
  [ 'also', 0.5956733582937029 ],
  [ 'test', 0.2472267810132493 ],
  [ 'document', 0.2472267810132493 ]
]
```

### With Node.js

Disclaimer: this is an ES6 module and is mostly intended for use in the browser, rather than with Node.js ([more background on ES6 modules and Node](https://github.com/nodejs/modules/blob/master/doc/announcement.md#es-module-code-in-packages)).

Example with Node v12.6.0 :

```sh
node --experimental-modules --es-module-specifier-resolution=node test.js
```
## API (v0.6)

### `Corpus` class

- constructor
- `getTerms()`
- `getCollectionFrequency(term)`
- `getDocument(identifier)`
- `getDocumentIdentifiers()`
- `getCommonTerms(identifier1, identifier2)`
- `getCollectionFrequencyWeight(term)`
- `getDocumentVector(identifier)`
- `getTopTermsForDocument(identifier)`
- `getTotalLength()`
- `getDistanceMatrix()`
- `getResultsForQuery(query)`

The other methods in the class (whose names start with `calculate`) are intended for internal use.

### `Document` class

- constructor
- `getText()`
- `getLength()`
- `getUniqueTerms()`
- `getTermFrequency(term)`

The other method, `calculateTermFrequencies`, is intended for internal use.

### `Similarity` class

- constructor: needs a `Corpus` object
- `getDistanceMatrix()`

Plus a static method, `cosineSimilarity(vector1, vector2)`, which is currently only used to calculate individual entries in the distance matrix. The other method, `calculateDistanceMatrix`, is intended for internal use.

### `Stopwords` class

- constructor
- `includes(term)`

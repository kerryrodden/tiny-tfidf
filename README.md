# tiny-tfidf
![npm](https://img.shields.io/npm/v/tiny-tfidf.svg)

Minimal implementations of a couple of classic text analysis tools (TF-IDF and cosine similarity). The goal is to create something simple that can be used to explain or experiment with the techniques, using a small set of documents. Everything is done in memory so this library is not suitable for large-scale use.

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
## API (v0.9)

### `Corpus` class

This is the main class that you will use directly. It takes care of creating a `Document` for every text and also manages `Stopwords` for the collection. It calculates term frequencies, term weights, and term vectors, and can return results for a given query.
- `constructor(names, texts, useDefaultStopwords = true, customStopwords = [], K1 = 2.0, b = 0.75)`: `names` and `texts` are parallel arrays containing the document identifiers and the full texts of each document
- `getTerms()`: an array of the terms in the corpus (excluding stopwords)
- `getCollectionFrequency(term)`: how many documents in the collection contain the given term
- `getDocument(identifier)`: return the `Document` object for the given `identifier`
- `getDocumentIdentifiers()`: an array of all identifiers in the corpus
- `getCommonTerms(identifier1, identifier2, maxTerms = 10)`: an array of the terms that the documents with these two identifiers have in common; each array entry is a pair of the term and a weight, and the array is sorted by weight, with a maximum length of `maxTerms` (which is optional and defaults to 10)
- `getCollectionFrequencyWeight(term)`: the collection frequency weight (or TF-IDF weight) for the given `term`
- `getDocumentVector(identifier)`: a `Map` with the unique terms and their corresponding collection frequency weights, for the document with the given `identifier`
- `getTopTermsForDocument(identifier, maxTerms = 30)`: terms with the highest collection frequency weights for the document with the given `identifier`, with a maximum length of `maxTerms` (which is optional and defaults to 30)
- `getResultsForQuery(query)`: an array representing the highest scoring documents for the given `query`; each array entry is a pair of a document identifier and a score
- `getStopwords()`: the `Stopwords` instance that is being used by this corpus

The other methods in the class (whose names start with `_calculate`) are intended for internal use.

### `Document` class

This is used by the `Corpus` class for each of the given texts. It is independent of any stopword list or term weights (which are managed at the corpus level) and only maintains the document-level term frequencies. Terms can contain only letters or numbers; they are filtered out if they contain only 1 character or if they start with a number.
- `constructor(text)`: expects a single one of the texts passed into `Corpus`
- `getText()`: returns a string containing the full text of this document (e.g. for display)
- `getLength()`: the total number of terms in the document (including stopwords)
- `getUniqueTerms()`: an array of the unique terms that appear in the document (including stopwords)
- `getTermFrequency(term)`: how often the given term appears in this document

The other method, `_calculateTermFrequencies`, is intended for internal use.

### `Stopwords` class

- `constructor(useDefaultStopwords = true, customStopwords = [])`: optional parameters that were used in the constructor for `Corpus`, to control whether the default stopword list should be used, and to specify any custom stopwords.
- `includes(term)`: returns `true` if the current stopword list contains the given `term`, or `false` otherwise
- `getStopwordList()`: returns an array of the stopword list currently in use (for inspection or debugging)

### `Similarity` class

An optional addition: once you have a `Corpus` you can use `Similarity` to calculate the pairwise similarity between the documents in the corpus, resulting in a distance matrix.
- `constructor(corpus)`: expects an instance of `Corpus`
- `getDistanceMatrix()`: returns an object with properties `identifiers` (an array of identifiers for the items in the matrix) and `matrix` (an array of arrays)

Plus a static method, `cosineSimilarity(vector1, vector2)`, which is currently only used to calculate individual entries in the distance matrix. The other method, `_calculateDistanceMatrix`, is intended for internal use.

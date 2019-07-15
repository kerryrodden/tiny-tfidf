# tiny-tfidf

Minimal implementations of a couple of classic text analysis tools (TF-IDF and cosine similarity). The goal is to create something simple that can be used to explain or experiment with the techniques, using a small set of documents.

The term weighting scheme is BM25, as described in this [technical report](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf) by Stephen Robertson and Karen Spärck Jones.

This is an ES6 module and is intended for use in the browser, rather than with Node.js ([more background](https://github.com/nodejs/modules/blob/master/doc/announcement.md#es-module-code-in-packages))

## Usage

```js
import { Corpus } from "tiny-tfidf";

const corpus = new Corpus(
  ["doc-1", "doc-2", "doc-3"],
  [
    "text1 for first document document 1-1 text1 for document 1-2",
    "text2 for second document aa document 2-2 text2 for document 2-2 text2 for document 2-3",
    "text3 for third document bb ccccc document 3-1"
  ]
);

// get a document
const doc = corpus.getDocument("doc-2");

// print 50 top terms for this document
console.log(doc.getTopTerms(50));

// prints
[
  ["second", 2.5843323952953945],
  ["text", 1.2091035289247862],
  ["document", 0.18177977729840644]
];
```

### With Node.js

Example with Node v12.6.0 :

```sh
node --experimental-modules --es-module-specifier-resolution=node test.js
```

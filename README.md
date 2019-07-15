# tiny-tfidf
Minimal implementations of a couple of classic text analysis tools (TF-IDF and cosine similarity). The goal is to create something simple that can be used to explain or experiment with the techniques, using a small set of documents. 

The term weighting scheme is BM25, as described in this [technical report](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf) by Stephen Robertson and Karen Spärck Jones.

This is an ES6 module and is intended for use in the browser, rather than with Node.js ([more background](https://github.com/nodejs/modules/blob/master/doc/announcement.md#es-module-code-in-packages))

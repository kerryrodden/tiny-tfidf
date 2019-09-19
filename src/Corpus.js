import Document from './Document.js';
import Stopwords from './Stopwords.js';
import Similarity from './Similarity.js';

// Implements TF-IDF (Term Frequency - Inverse Document Frequency) using BM25 weighting, as described in:
// https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf

export default class Corpus {

  // K1 and b are tuning constants from the report mentioned above:
  // - K1 modifies term frequency (higher values increase the influence)
  // - b modifies document length (between 0 and 1; 1 means that long documents are repetitive and 0 means they are multitopic)

  constructor(names, texts, useStopwords = true, customStopwords = [], K1 = 1.5, b = 0.75) {
    this.stopwords = useStopwords ? new Stopwords(customStopwords) : null;
    this.K1 = K1;
    this.b = b;
    this.documents = new Map();
    for (let i = 0; i < texts.length; i++) {
      this.documents.set(names[i], new Document(texts[i]));
    }
    this.collectionFrequencies = null;
    this.collectionFrequencyWeights = null;
    this.documentVectors = null;
    this.totalLength = 0;
    this.similarity = null;
  }

  // Collection frequency = how many unique documents each term appears in
  calculateCollectionFrequencies() {
    this.collectionFrequencies = new Map();
    for (const document of this.documents.values()) {
      let terms = document.getUniqueTerms();
      if (this.stopwords) {
        terms = terms.filter(t => !this.stopwords.includes(t));
      }
      terms.forEach((term) => {
        if (this.collectionFrequencies.has(term)) {
          const n = this.collectionFrequencies.get(term);
          this.collectionFrequencies.set(term, n + 1);
        } else {
          this.collectionFrequencies.set(term, 1);
        }
      });
    };
  }

  // Return an array containing the unique terms in this corpus (excluding stopwords)
  getTerms() {
    if (!this.collectionFrequencies) {
      this.calculateCollectionFrequencies();
    }
    return Array.from(this.collectionFrequencies.keys());
  }

  getCollectionFrequencies() {
    console.warn("tiny-tfidf: Corpus.getCollectionFrequencies() is deprecated and has been replaced by Corpus.getCollectionFrequency(term).");
    return null;
  }

  getCollectionFrequency(term) {
    if (!this.collectionFrequencies) {
      this.calculateCollectionFrequencies();
    }
    return this.collectionFrequencies.get(term);
  }

  getDocument(identifier) {
    return this.documents.get(identifier);
  }

  getDocumentIdentifiers() {
    return [...this.documents.keys()];
  }

  getCommonTerms(identifier1, identifier2, maxTerms = 10) {
    const vector1 = this.getDocumentVector(identifier1);
    const vector2 = this.getDocumentVector(identifier2);
    const commonTerms = [...vector1.entries()].map(([term, cw]) => [term, cw * vector2.get(term)]).filter(d => d[1] > 0);
    return commonTerms.sort((a, b) => b[1] - a[1]).slice(0, maxTerms);
  }

  // Collection frequency weight (a.k.a. inverse document frequency). Compared to the formula in the original paper,
  // we add 1 to N (the number of documents in the collection) so that terms which appear in every document (and are not
  // stopwords) get a very small CFW instead of zero (and therefore, later, get a very small weight instead of zero, meaning
  // that they can still be retrieved by queries and appear in similarity calculations).
  calculateCollectionFrequencyWeights() {
    if (!this.collectionFrequencies) {
      this.calculateCollectionFrequencies();
    }
    this.collectionFrequencyWeights = new Map();
    const N = this.documents.size;
    for (const [term, n] of this.collectionFrequencies.entries()) {
      this.collectionFrequencyWeights.set(term, Math.log(N + 1) - Math.log(n));
    }
  }

  getCollectionFrequencyWeights() {
    console.warn("tiny-tfidf: Corpus.getCollectionFrequencyWeights() is deprecated and has been replaced by Corpus.getCollectionFrequencyWeight(term).");
    return null;
  }

  getCollectionFrequencyWeight(term) {
    if (!this.collectionFrequencyWeights) {
      this.calculateCollectionFrequencyWeights();
    }
    return this.collectionFrequencyWeights.get(term);
  }

  calculateDocumentVectors() {
    if (!this.collectionFrequencyWeights) {
      this.calculateCollectionFrequencyWeights();
    }
    this.documentVectors = new Map();
    const K1 = this.K1;
    const b = this.b;
    const avgLength = this.getTotalLength() / this.documents.size;
    for (const [identifier, document] of this.documents) {
      const vector = new Map();
      const ndl = document.getAllTerms().length / avgLength;
      for (const [term, idf] of this.collectionFrequencyWeights.entries()) {
        let cw = 0.0;
        const tf = document.getFrequency(term);
        if (tf) {
          cw = (idf * tf * (K1 + 1)) / ((K1 * ((1 - b) + (b * ndl))) + tf);
        }
        vector.set(term, cw);
      }
      this.documentVectors.set(identifier, vector);
    }
  }

  getDocumentVector(identifier) {
    if (!this.documentVectors) {
      this.calculateDocumentVectors();
    }
    return this.documentVectors.get(identifier);
  }

  getTopTermsForDocument(identifier, numTerms = 30) {
    const vector = this.getDocumentVector(identifier);
    if (!vector) return [];
    const sortedTerms = [...vector.entries()].filter(d => d[1] > 0.0).sort((a, b) => b[1] - a[1]); // descending order
    return sortedTerms.slice(0, numTerms);
  }

  calculateTotalLength() {
    // Total length of the collection, calculated here as the sum of all document lengths
    this.totalLength = [...this.documents.values()].map(d => d.getAllTerms().length).reduce((a,b) => a + b, 0);
  }

  getTotalLength() {
    if (!this.totalLength) {
      this.calculateTotalLength();
    }
    return this.totalLength;
  }

  getSimilarityMatrix() {
    console.warn("tiny-tfidf: Corpus.getSimilarityMatrix() is deprecated and has been replaced by Corpus.getDistanceMatrix().");
    return this.getDistanceMatrix();
  }

  getDistanceMatrix() {
    if (!this.similarity) {
      this.similarity = new Similarity(this);
    }
    return this.similarity.getDistanceMatrix();
  }

  findSimilarDocumentsForQuery(term) {
    console.warn('tiny-tfidf: Corpus.findSimilarDocumentsForQuery() has been replaced by Corpus.getResultsForQuery().');
    return this.getResultsForQuery(term);
  }
  // Score each document against the query string, returning a ranked list of document identifiers and scores.
  // The score for a document is the total combined weight of each query term that appears in the document.
  getResultsForQuery(query) {
    if (!query || typeof query !== "string" || query.length === 0) {
      return [];
    }
    const terms = new Document(query).getUniqueTerms();
    const scores = this.getDocumentIdentifiers().map(d => {
      const vector = this.getDocumentVector(d);
      let score = 0.0;
      terms.forEach(t => {
        const weight = vector.get(t);
        if (weight) {
          score += weight;
        }
      });
      return [d, score];
    });
    return scores.filter(d => d[1] > 0).sort((a, b) => b[1] - a[1]);
  }
}

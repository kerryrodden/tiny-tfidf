import Document from './Document.js';
import Stopwords from './Stopwords.js';

// Implements TF-IDF (Term Frequency - Inverse Document Frequency) using BM25 weighting, as described in:
// https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf

export default class Corpus {

  // K1 and b are tuning constants from the report mentioned above:
  // - K1 modifies term frequency (higher values increase the influence)
  // - b modifies document length (between 0 and 1; 1 means that long documents are repetitive and 0 means they are multitopic)

  constructor(names, texts, customStopwords = [], K1 = 1.5, b = 0.75) {
    this.stopwords = new Stopwords(customStopwords);
    this.stopwordFilter = term => !this.stopwords.includes(term);
    this.K1 = K1;
    this.b = b;
    this.documents = new Map();
    for (let i = 0; i < texts.length; i++) {
      this.documents.set(names[i], new Document(texts[i]));
    }
    this.collectionFrequencies = null;
    this.collectionFrequencyWeights = null;
    this.uniqueDocuments = null;
    this.documentVectors = null;
    this.totalLength = 0;
  }

  calculateCollectionFrequencies() {
    this.collectionFrequencies = new Map();
    this.uniqueDocuments = new Map();
    for (const [identifier, document] of this.documents.entries()) {
      document.getUniqueTerms().filter(this.stopwordFilter).forEach((term) => {
        const frequency = document.getFrequency(term);
        if (this.collectionFrequencies.has(term)) {
          const n = this.collectionFrequencies.get(term);
          this.collectionFrequencies.set(term, n + frequency);
        } else {
          this.collectionFrequencies.set(term, frequency);
        }
        // Keep track of how many unique documents each term appears in
        if (this.uniqueDocuments.has(term)) {
          const s = this.uniqueDocuments.get(term);
          this.uniqueDocuments.set(term, s.add(identifier));
        } else {
          this.uniqueDocuments.set(term, new Set([identifier]));
        }
      });
    };
  }

  getCollectionFrequencies() {
    if (!this.collectionFrequencies) {
      this.calculateCollectionFrequencies();
    }
    return this.collectionFrequencies;
  }

  getDocument(identifier) {
    return this.documents.get(identifier);
  }

  getUniqueDocuments() {
    if (!this.uniqueDocuments) {
      this.calculateCollectionFrequencies();
    }
    return this.uniqueDocuments;
  }

  // TODO: potentially cut total number of terms off at a number
  getImportantTerms(numTermsPerDocument = 30) {
    const topTerms = this.getDocumentIdentifiers().map(d => this.getTopTermsForDocument(d, numTermsPerDocument)).flat().sort((a, b) => b[1] - a[1]);
    const uniqueTopTerms = [...new Set(topTerms.map(t => t[0]))];
    const importantTerms = uniqueTopTerms.filter(t => this.getUniqueDocuments().get(t).size > 1);
    return importantTerms;
  }

  getTermAsVector(t) {
    const vector = new Map();
    for (const [term, idf] of this.getCollectionFrequencyWeights().entries()) {
      const weight = (t === term) ? idf : 0.0;
      vector.set(term, weight);
    }
    return vector;
  }

  getDocumentIdentifiers() {
    return [...this.documents.keys()];
  }

  getCommonTerms(identifier1, identifier2, maxTerms = 10) {
    const vector1 = this.getDocumentVector(identifier1);
    const vector2 = this.getDocumentVector(identifier2);
    const commonTerms = [...vector1.entries()].map(([term, cw]) => [term, cw * vector2.get(term)]).filter(d => d[1] > 0);
    return commonTerms.sort((a, b) => b[1] - a[1]).map(d => d[0]).slice(0, maxTerms);
  }

  calculateCollectionFrequencyWeights() {
    this.collectionFrequencyWeights = new Map();
    const N = this.getTotalLength();
    for (const [term, n] of this.getCollectionFrequencies().entries()) {
      this.collectionFrequencyWeights.set(term, Math.log((N - n) / n));
    }
  }

  getCollectionFrequencyWeights() {
    if (!this.collectionFrequencyWeights) {
      this.calculateCollectionFrequencyWeights();
    }
    return this.collectionFrequencyWeights;
  }

  calculateDocumentVectors() {
    this.documentVectors = new Map();
    const K1 = this.K1;
    const b = this.b;
    const avgLength = this.getTotalLength() / this.documents.size;
    for (const [identifier, document] of this.documents) {
      const vector = new Map();
      for (const [term, idf] of this.getCollectionFrequencyWeights().entries()) {
        let cw = 0.0;
        const tf = document.getFrequency(term);
        if (tf) {
          const ndl = document.getLength(this.stopwordFilter) / avgLength;
          cw = (idf * tf * (K1 + 1)) / ((K1 * ((1 - b) + (b * ndl))) + tf);
        }
        vector.set(term, cw);
      }
      this.documentVectors.set(identifier, vector);
    }
  }

  getDocumentVectors() {
    if (!this.documentVectors) {
      this.calculateDocumentVectors();
    }
    return this.documentVectors;
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
    // Total length of the collection, calculated here as the sum of all term frequencies (minus stopwords)
    this.totalLength = [...this.getCollectionFrequencies().values()].reduce((a,b) => a + b, 0);
  }

  getTotalLength() {
    if (!this.totalLength) {
      this.calculateTotalLength();
    }
    return this.totalLength;
  }
}

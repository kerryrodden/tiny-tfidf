import Document from './Document.js';
import Stopwords from './Stopwords.js';

// Implements TF-IDF (Term Frequency - Inverse Document Frequency) using BM25 weighting, as described in:
// https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-356.pdf

export default class Corpus {

  // K1 and b are tuning constants from the report mentioned above:
  // - K1 modifies term frequency (higher values increase the influence)
  // - b modifies document length (between 0 and 1; 1 means that long documents are repetitive and 0 means they are multitopic)

  constructor(names, texts, customStopwords = [], K1 = 1.5, b = 0.75) {
    this.stopwordFilter = term => !Stopwords.includes(term) && !customStopwords.includes(term);
    this.K1 = K1;
    this.b = b;
    this.documents = new Map();
    this.collectionFreq = new Map();
    this.termWeights = new Map();
    this.uniqueDocuments = new Map();
    for (let i = 0; i < texts.length; i++) {
      this.documents.set(names[i], new Document(texts[i]));
    }
    this.calculateTermFrequencies();
    this.calculateTermWeights();
    this.calculateVectors();
  }

  calculateTermFrequencies() {
    for (const [identifier, document] of this.documents.entries()) {
      document.getUniqueTerms().filter(this.stopwordFilter).forEach((term) => {
        const frequency = document.getFrequency(term);
        if (this.collectionFreq.has(term)) {
          const n = this.collectionFreq.get(term);
          this.collectionFreq.set(term, n + frequency);
        } else {
          this.collectionFreq.set(term, frequency);
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
    // Total length of the collection, calculated here as the sum of all term frequencies (minus stopwords)
    this.totalLength = [...this.collectionFreq.values()].reduce((a,b) => a + b, 0);
  }

  getDocument(identifier) {
    return this.documents.get(identifier);
  }

  // TODO: potentially cut total number of terms off at a number
  getImportantTerms(numTermsPerDocument = 30) {
    const topTerms = [...this.documents.values()].map(d => d.getTopTerms(numTermsPerDocument)).flat().sort((a, b) => b[1] - a[1]);
    const uniqueTopTerms = [...new Set(topTerms.map(t => t[0]))];
    const importantTerms = uniqueTopTerms.filter(t => this.uniqueDocuments.get(t).size > 1);
    return importantTerms;
  }

  getTermAsVector(t) {
    const vector = new Map();
    for (const [term, idf] of this.termWeights.entries()) {
      const weight = (t === term) ? idf : 0.0;
      vector.set(term, weight);
    }
    return vector;
  }

  getDocumentIdentifiers() {
    return [...this.documents.keys()];
  }

  calculateTermWeights() {
    const N = this.totalLength;
    for (const [term, n] of this.collectionFreq.entries()) {
      this.termWeights.set(term, Math.log((N - n) / n));
    }
  }

  calculateVectors() {
    const K1 = this.K1;
    const b = this.b;
    const avgLength = this.totalLength / this.documents.size;
    for (const [identifier, document] of this.documents) {
      const vector = new Map();
      for (const [term, idf] of this.termWeights.entries()) {
        let cw = 0.0;
        const tf = document.getFrequency(term);
        if (tf) {
          const ndl = document.getLength(this.stopwordFilter) / avgLength;
          cw = (idf * tf * (K1 + 1)) / ((K1 * ((1 - b) + (b * ndl))) + tf);
        }
        vector.set(term, cw);
      }
      document.setVector(vector);
    }
  }
}

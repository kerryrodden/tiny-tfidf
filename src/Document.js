export default class Document {
  constructor(text) {
    this._text = text;
    this._words = text.match(/[a-zA-ZÀ-ÖØ-öø-ÿ]+/g).filter(word => {
      // Exclude very short terms and terms that start with a number
      // Stopwords are dealt with by the Corpus class
      if (word.length <= 2 || word.match(/^\d/)) {
        return false;
      } else {
        return true;
      }
    }).map(word => word.toLowerCase());
    this._termFrequencies = null;
  }

  _calculateTermFrequencies() {
    this._termFrequencies = new Map();
    this._words.forEach(word => {
      if (this._termFrequencies.has(word)) {
        this._termFrequencies.set(word, this._termFrequencies.get(word) + 1);
      }
      else {
        this._termFrequencies.set(word, 1);
      }
    });
  }

  getTermFrequencies() {
    console.warn("tiny-tfidf: Document.getTermFrequencies() is deprecated; use Document.getTermFrequency(term) instead.");
    return null;
  }

  getTermFrequency(term) {
    if (!this._termFrequencies) {
      this._calculateTermFrequencies();
    }
    return this._termFrequencies.get(term);
  }

  getText() {
    return this._text;
  }

  getLength() {
    return this._words.length;
  }

  getAllTerms() {
    console.warn("tiny-tfidf: Document.getAllTerms() is deprecated.");
    return null;
  }

  getUniqueTerms() {
    if (!this._termFrequencies) {
      this._calculateTermFrequencies();
    }
    return Array.from(this._termFrequencies.keys());
  }

  getFrequency(term) {
    console.warn("tiny-tfidf: Document.getFrequency() is deprecated; use Document.getTermFrequency() instead.");
    return this.getTermFrequency(term);
  }

  setVector(vector) {
    console.warn("tiny-tfidf: Document.setVector() is deprecated and its functionality moved to Corpus.");
  }

  getVector() {
    console.warn("tiny-tfidf: Document.getVector() is deprecated; use Corpus.getDocumentVector() instead.");
    return new Map();
  }

  getTopTerms(numTerms = 30) {
    console.warn("tiny-tfidf: Document.getTopTerms() is deprecated; use Corpus.getTopTermsForDocument() instead.");
    const sortedTerms = [...this.getVector().entries()].filter(d => d[1] > 0.0).sort((a, b) => b[1] - a[1]); // descending order
    return sortedTerms.slice(0, numTerms);
  }
}


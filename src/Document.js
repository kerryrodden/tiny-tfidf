export default class Document {
  constructor(text) {
    this.text = text;
    this.words = text.match(/[a-zA-ZÀ-ÖØ-öø-ÿ]+/g).filter(word => {
      // Exclude very short terms and terms that start with a number
      // Stopwords are dealt with by the Corpus class
      if (word.length <= 2 || word.match(/^\d/)) {
        return false;
      } else {
        return true;
      }
    }).map(word => word.toLowerCase());
    this.termFrequencies = null;
  }

  calculateTermFrequencies() {
    this.termFrequencies = new Map();
    this.words.forEach(word => {
      if (this.termFrequencies.has(word)) {
        this.termFrequencies.set(word, this.termFrequencies.get(word) + 1);
      }
      else {
        this.termFrequencies.set(word, 1);
      }
    });
  }

  getTermFrequencies() {
    if (!this.termFrequencies) {
      this.calculateTermFrequencies();
    }
    return this.termFrequencies;
  }

  getText() {
    return this.text;
  }

  getLength() {
    console.warn("tiny-tfidf: Document.getLength() is deprecated - use Document.getAllTerms().");
    return this.getAllTerms().length;
  }

  getAllTerms() {
    return this.words;
  }

  getUniqueTerms() {
    return [...this.getTermFrequencies().keys()];
  }

  getFrequency(term) {
    return this.getTermFrequencies().get(term);
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


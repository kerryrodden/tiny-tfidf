export default class Document {
  constructor(text) {
    this._text = text;
    this._words = text
      .match(/[a-zA-ZÀ-ÖØ-öø-ÿ]+/g)
      .filter(word => {
        // Exclude very short terms and terms that start with a number
        // Stopwords are dealt with by the Corpus class
        if (word.length === 2 || word.match(/^\d/)) {
          return false;
        } else {
          return true;
        }
      })
      .map(word => word.toLowerCase());
    this._termFrequencies = null;
  }

  _calculateTermFrequencies() {
    this._termFrequencies = new Map();
    this._words.forEach(word => {
      if (this._termFrequencies.has(word)) {
        this._termFrequencies.set(word, this._termFrequencies.get(word) + 1);
      } else {
        this._termFrequencies.set(word, 1);
      }
    });
  }

  getTermFrequency(term) {
    if (!this._termFrequencies) {
      this._calculateTermFrequencies();
    }
    if (this._termFrequencies.has(term)) {
      return this._termFrequencies.get(term);
    } else {
      return null;
    }
  }

  getText() {
    return this._text;
  }

  getLength() {
    return this._words.length;
  }

  getUniqueTerms() {
    if (!this._termFrequencies) {
      this._calculateTermFrequencies();
    }
    return Array.from(this._termFrequencies.keys());
  }
}

// This is used by the Corpus class for each of the given texts. It is independent of any stopword
// list or term weights (which are managed at the corpus level) and only maintains the
// document-level term frequencies. Terms can contain only letters or numbers; they are filtered
// out if they contain only 1 character or if they start with a number.
export default class Document {

  // Expects a single one of the texts originally passed into Corpus
  constructor(text) {
    this._text = text;
    this._words = text
      .match(/[a-zA-ZÀ-ÖØ-öø-ÿ]+/g)
      .filter(word => {
        // Exclude very short terms and terms that start with a number
        // (stopwords are dealt with by the Corpus class)
        if (word.length < 2 || word.match(/^\d/)) {
          return false;
        } else {
          return true;
        }
      })
      .map(word => word.toLowerCase());
    this._termFrequencies = null;
  }

  // Internal method to count how often each term appears in this document
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

  // Returns a count of how often the given term appears in this document
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

  // Returns a string containing the full text of this document (e.g. for display)
  getText() {
    return this._text;
  }

  // Returns the total number of terms in the document (including stopwords)
  getLength() {
    return this._words.length;
  }

  // Returns an array of the unique terms that appear in the document (including stopwords)
  getUniqueTerms() {
    if (!this._termFrequencies) {
      this._calculateTermFrequencies();
    }
    return Array.from(this._termFrequencies.keys());
  }
}

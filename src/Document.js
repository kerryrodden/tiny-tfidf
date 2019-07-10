export default class Document {
  constructor(text) {
    this.text = text;
    this.termFreq = new Map();
    this.words = text.match(/[a-zA-ZÀ-ÖØ-öø-ÿ]+/g).filter(word => {
      // Exclude very short terms and terms that start with a number
      // Stopwords are dealt with later, when we calculate vectors and weights
      if (word.length <= 2 || word.match(/^\d/)) {
        return false;
      } else {
        return true;
      }
    }).map(word => word.toLowerCase());
    this.words.forEach(word => {
      if (this.termFreq.has(word)) {
        this.termFreq.set(word, this.termFreq.get(word) + 1);
      }
      else {
        this.termFreq.set(word, 1);
      }
    });
  }

  getText() {
    return this.text;
  }

  getLength(stopwordFilter = () => true) {
    return this.words.filter(stopwordFilter).length;
  }

  getUniqueTerms() {
    return [...this.termFreq.keys()];
  }

  getFrequency(term) {
    return this.termFreq.get(term);
  }

  setVector(vector) {
    this.vector = vector;
  }

  getVector() {
    return this.vector;
  }

  getTopTerms(numTerms = 30) {
    const sortedTerms = [...this.vector.entries()].filter(d => d[1] > 0.0).sort((a, b) => b[1] - a[1]); // descending order
    return sortedTerms.slice(0, numTerms);
  }
}


import Corpus from './Corpus.js';

export default class Similarity {
  constructor(corpus) {
    this.corpus = corpus;
    this.distanceMatrix = null; // this is expensive to calculate so only do it when needed
  }

  static cosineSimilarity(vector1, vector2) {
    const v1 = [...vector1.values()];
    const v2 = [...vector2.values()];
    let dotProduct = 0.0;
    let ss1 = 0.0;
    let ss2 = 0.0;
    const length = Math.min(v1.length, v2.length);
    for (let i = 0; i < length; i++) {
      dotProduct += v1[i] * v2[i];
      ss1 += v1[i] * v1[i];
      ss2 += v2[i] * v2[i];
    }
    const magnitude = Math.sqrt(ss1) * Math.sqrt(ss2);
    return magnitude ? dotProduct / magnitude : 0.0;
  }

  findSimilarDocuments(term) {
    console.warn("tiny-tfidf: Similarity.findSimilarDocuments() is deprecated and its functionality moved to Corpus.");
    return this.corpus.findSimilarDocumentsForQuery(term);
  }

  calculateDistanceMatrix() {
    const identifiers = this.corpus.getDocumentIdentifiers();
    const vectors = identifiers.map(d => this.corpus.getDocumentVector(d));

    // Calculate the distance between each pair of documents. Distance is 1.0 - similarity (so 0 = identical)
    const matrix = new Array(vectors.length).fill(null).map(() => new Array(vectors.length));
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i; j < vectors.length; j++) {
        if (i === j) {
          matrix[i][j] = 0.0;
        } else {
          matrix[i][j] = 1.0 - Similarity.cosineSimilarity(vectors[i], vectors[j]);
          matrix[j][i] = matrix[i][j];
        }
      }
    }
    this.distanceMatrix = { identifiers, matrix };
  }

  getDistanceMatrix() {
    if (!this.distanceMatrix) {
      this.calculateDistanceMatrix();
    }
    return this.distanceMatrix;
  }

  getSimilarityMatrix() {
    console.warn("tiny-tfidf: Similarity.getSimilarityMatrix() is deprecated and has been replaced by Similarity.getDistanceMatrix().");
    return this.getDistanceMatrix();
  }
}

import Corpus from './Corpus.js';

export default class Similarity {
  constructor(corpus) {
    this.corpus = corpus;
    this.similarityMatrix = null; // this is expensive to calculate so only do it when needed
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

  calculateSimilarityMatrix() {
    const identifiers = this.corpus.getDocumentIdentifiers();
    const vectors = identifiers.map(d => this.corpus.getDocumentVector(d));

    // Calculate the similarity matrix. Technically they are dissimilarities (0 = identical)
    let matrix = [];
    for (let i = 0; i < vectors.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < vectors.length; j++) {
        matrix[i][j] = 1.0 - Similarity.cosineSimilarity(vectors[i], vectors[j]);
      }
    }
    this.similarityMatrix = { identifiers, matrix };
  }

  getSimilarityMatrix() {
    if (!this.similarityMatrix) {
      this.calculateSimilarityMatrix();
    }
    return this.similarityMatrix;
  }
}

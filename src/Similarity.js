import Corpus from './Corpus.js';

export default class Similarity {
  constructor(corpus) {
    this.corpus = corpus;
    this.similarityMatrix = null; // this is expensive to calculate so only do it when needed
  }

  static cosineSimilarity(vector1, vector2) {
    let dotProduct = 0.0;
    let ss1 = 0.0;
    let ss2 = 0.0;
    const length = Math.min(vector1.length, vector2.length);
    for (let i = 0; i < length; i++) {
      dotProduct += vector1[i] * vector2[i];
      ss1 += vector1[i] * vector1[i];
      ss2 += vector2[i] * vector2[i];
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
      let v_i = [...vectors[i].values()];
      for (let j = 0; j < vectors.length; j++) {
        let v_j = [...vectors[j].values()];
        matrix[i][j] = 1.0 - Similarity.cosineSimilarity(v_i, v_j);
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

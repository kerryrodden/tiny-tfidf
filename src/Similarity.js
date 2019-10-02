/**
 * For calculating the pairwise similarity between documents in the corpus, in particular to create
 * a distance matrix (distance = 1 - similarity).
 */
export default class Similarity {

  // Expects an instance of Corpus
  constructor(corpus) {
    this._corpus = corpus;
    // This is expensive to calculate so only do it on request
    this._distanceMatrix = null;
  }

  /**
   * Calculates the similarity between a pair of document vectors (as the cosine of the angle
   * between them): https://en.wikipedia.org/wiki/Cosine_similarity
   */
  static cosineSimilarity(vector1, vector2) {
    const v1 = Array.from(vector1.values());
    const v2 = Array.from(vector2.values());
    let dotProduct = 0.0;
    let ss1 = 0.0;
    let ss2 = 0.0;
    const length = Math.min(v1.length, v2.length);
    for (let i = 0; i < length; i++) {
      // Ignore pairs that will not affect either the dot product or the magnitude
      if (v1[i] === 0 && v2[i] === 0) continue;
      dotProduct += v1[i] * v2[i];
      ss1 += v1[i] * v1[i];
      ss2 += v2[i] * v2[i];
    }
    const magnitude = Math.sqrt(ss1) * Math.sqrt(ss2);
    return magnitude ? dotProduct / magnitude : 0.0;
  }

  _calculateDistanceMatrix() {
    const identifiers = this._corpus.getDocumentIdentifiers();
    const vectors = identifiers.map(d => this._corpus.getDocumentVector(d));

    // Calculate the distance between each pair of documents
    const matrix = new Array(vectors.length).fill(null).map(() => new Array(vectors.length));
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i; j < vectors.length; j++) {
        if (i === j) {
          // A document is identical to itself
          matrix[i][j] = 0.0;
        } else {
          matrix[i][j] = 1.0 - Similarity.cosineSimilarity(vectors[i], vectors[j]);
          matrix[j][i] = matrix[i][j]; // the matrix is symmetric
        }
      }
    }
    this._distanceMatrix = { identifiers, matrix };
  }

  /**
   * Returns an object with properties "identifiers" (an array of identifiers for the items in the
   * matrix) and "matrix" (an array of arrays, where the values represent distances between items).
   * Distance is 1.0 - similarity (so 0 = identical)
   */
  getDistanceMatrix() {
    if (!this._distanceMatrix) {
      this._calculateDistanceMatrix();
    }
    return this._distanceMatrix;
  }
}

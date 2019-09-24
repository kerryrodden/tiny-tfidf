export default class Similarity {
  constructor(corpus) {
    this._corpus = corpus;
    this._distanceMatrix = null; // this is expensive to calculate so only do it when needed
  }

  static cosineSimilarity(vector1, vector2) {
    const v1 = Array.from(vector1.values());
    const v2 = Array.from(vector2.values());
    let dotProduct = 0.0;
    let ss1 = 0.0;
    let ss2 = 0.0;
    const length = Math.min(v1.length, v2.length);
    for (let i = 0; i < length; i++) {
      if (v1[i] === 0 && v2[i] === 0) continue; // This pair of terms will not affect either the dot product or the magnitude
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

    // Calculate the distance between each pair of documents. Distance is 1.0 - similarity (so 0 = identical)
    const matrix = new Array(vectors.length).fill(null).map(() => new Array(vectors.length));
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i; j < vectors.length; j++) {
        if (i === j) {
          matrix[i][j] = 0.0; // a document is identical to itself
        } else {
          matrix[i][j] = 1.0 - Similarity.cosineSimilarity(vectors[i], vectors[j]);
          matrix[j][i] = matrix[i][j]; // the matrix is symmetric
        }
      }
    }
    this._distanceMatrix = { identifiers, matrix };
  }

  getDistanceMatrix() {
    if (!this._distanceMatrix) {
      this._calculateDistanceMatrix();
    }
    return this._distanceMatrix;
  }
}

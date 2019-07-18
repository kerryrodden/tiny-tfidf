import Corpus from './Corpus.js';
import Document from './Document.js';

function cosineSimilarity(vector1, vector2) {
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

export default class Similarity {
  constructor(corpus) {
    this.corpus = corpus;
    this.similarityMatrix = null; // this is expensive to calculate so only do it when needed
  }

  findSimilarDocuments(term) {
    const termVector = this.corpus.getTermAsVector(term.toLowerCase());
    const termVectorArray = [...termVector.values()];
    const documentIdentifiers = this.corpus.getDocumentIdentifiers();
    const documentVectors = documentIdentifiers.map(d => this.corpus.getDocumentVector(d));
    const similarities = documentVectors.map(d => {
      const dArray = [...d.values()];
      return cosineSimilarity(termVectorArray, dArray);
    });
    return documentIdentifiers.map((d, i) => [d, similarities[i]]).filter(d => d[1] > 0).sort((a, b) => b[1] - a[1]);
  }

  calculateSimilarityMatrix(includeTerms = true, numTermsPerDocument = 30) {
    // Choose important terms and create a vector for each of those terms
    // Important = occurs in more than one document, and is in the top-weighted terms for at least one document

    const importantTerms = this.corpus.getImportantTerms(numTermsPerDocument);
    const importantTermVectors = importantTerms.map(t => this.corpus.getTermAsVector(t));

    // Now get the term vector for each document, and combine with the important terms to make one array
    const documentIdentifiers = this.corpus.getDocumentIdentifiers();
    const documentVectors = documentIdentifiers.map(d => this.corpus.getDocumentVector(d));

    const identifiers = includeTerms ? [...importantTerms, ...documentIdentifiers] : [...documentIdentifiers];
    const vectors = includeTerms ? [...importantTermVectors, ...documentVectors] : [...documentVectors];

    // Calculate the similarity matrix. Technically they are dissimilarities (0 = identical)
    let matrix = [];
    for (let i = 0; i < vectors.length; i++) {
      matrix[i] = [];
      let v_i = [...vectors[i].values()];
      for (let j = 0; j < vectors.length; j++) {
        let v_j = [...vectors[j].values()];
        matrix[i][j] = 1.0 - cosineSimilarity(v_i, v_j);
      }
    }
    this.similarityMatrix = { identifiers, matrix };
  }

  getSimilarityMatrix(includeTerms = true, numTermsPerDocument = 30) {
    if (!this.similarityMatrix) {
      this.calculateSimilarityMatrix(includeTerms, numTermsPerDocument);
    }
    return this.similarityMatrix;
  }
}

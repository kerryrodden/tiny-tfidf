import { Corpus, Similarity, Stopwords } from './index.js';
import tape from 'tape';

const corpus = new Corpus(
  ['document1', 'document2', 'document3'],
  [
    'This is test document number 1. It is quite a short document.',
    'This is test document 2. It is also quite short, and is a test.',
    'Test document number three is a bit different and is also a tiny bit longer.'
  ]
);

tape('Unit tests for Corpus class', function (t) {
  t.plan(17);

  t.equal(corpus.getDocumentIdentifiers().length, 3);

  const terms = corpus.getTerms();
  t.ok(terms.includes('test'));
  t.ok(terms.includes('short'));
  t.notOk(terms.includes('1')); // number
  t.notOk(terms.includes('a')); // too short
  t.notOk(terms.includes('and')); // stopword

  t.equal(corpus.getCollectionFrequency('test'), 3);
  t.equal(corpus.getCollectionFrequency('short'), 2);
  t.equal(corpus.getCollectionFrequency('and'), null); // stopword

  // 'quite' and 'short' should be the top two common terms for documents 1 & 2, because they appear in
  // both documents and not in document 3
  const topTwo = corpus.getCommonTerms('document1', 'document2').map(d => d[0]).slice(0, 2).sort();
  t.ok(topTwo[0] === 'quite' && topTwo[1] === 'short');

  // 'test' should have a lower weight than 'short' because it appears in more documents
  const testWeight = corpus.getCollectionFrequencyWeight('test');
  const shortWeight = corpus.getCollectionFrequencyWeight('short');
  t.ok(testWeight < shortWeight);

  const topTerms = corpus.getTopTermsForDocument('document3');
  // Terms after stopword filtering: ['test', 'document', 'number', 'three', 'bit', 'different', 'also', 'tiny', 'longer']
  t.equal(topTerms.length, 9);
  // 'bit' should have the highest weight, because it appears twice in document 3 and only in that document
  t.equal(topTerms[0][0], 'bit');

  const queryResults = corpus.getResultsForQuery('a bit of a test query');
  // All documents should match this query (because of the term 'test')
  t.equal(queryResults.length, 3);
  // Document 3 should be the highest ranked (because of the term 'bit')
  t.equal(queryResults[0][0], 'document3');
  // We should guard against a query that is empty or is not a string
  t.equal(corpus.getResultsForQuery("").length, 0);
  t.equal(corpus.getResultsForQuery(2).length, 0);
});

tape('Unit tests for Document class', function (t) {
  t.plan(4);
  const doc = corpus.getDocument('document3');

  const terms = doc.getUniqueTerms();
  // We have ignored short terms (<2 characters) and stripped numbers, and have not yet applied stopword filtering
  // So unique terms are ['test', 'document', 'number', 'three', 'is', 'bit', 'different', 'and', 'also', 'tiny', 'longer']
  t.equal(terms.length, 11);

  t.equal(doc.getTermFrequency('bit'), 2);
  t.equal(doc.getTermFrequency('and'), 1); // stopwords are still present at the document level
  t.equal(doc.getTermFrequency('a'), null); // too short
});

tape('Unit tests for Similarity class', function (t) {
  t.plan(2);
  const similarity = new Similarity(corpus);
  const distanceMatrix = similarity.getDistanceMatrix();
  t.equal(distanceMatrix.identifiers.length, 3);
  // The first two documents should be more similar to each other (i.e. less distant) than the first and third.
  t.ok(distanceMatrix.matrix[0][1] < distanceMatrix.matrix[0][2]);
});

tape('Unit tests for Stopwords class', function (t) {
  t.plan(9);
  const customStopwords = ['test', 'words'];

  const defaultPlusCustomStopwords = new Stopwords(true, customStopwords);
  t.ok(defaultPlusCustomStopwords.includes('test'));
  t.ok(defaultPlusCustomStopwords.includes('words'));
  t.ok(defaultPlusCustomStopwords.includes('the'));

  const emptyStopwords = new Stopwords(false, []);
  t.notOk(emptyStopwords.includes('test'));
  t.notOk(emptyStopwords.includes('words'));
  t.notOk(emptyStopwords.includes('the'));

  const customStopwordsOnly = new Stopwords(false, customStopwords);
  t.ok(customStopwordsOnly.includes('test'));
  t.ok(customStopwordsOnly.includes('words'));
  t.notOk(customStopwordsOnly.includes('the'));
});

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

  // 'quite' and 'short' should be the top two common terms for documents 1 & 2, because they
  // appear in both documents and not in document 3
  const topTwo = corpus.getCommonTerms('document1', 'document2').map(d => d[0]).slice(0, 2).sort();
  t.ok(topTwo[0] === 'quite' && topTwo[1] === 'short');

  // 'test' should have a lower weight than 'short' because it appears in more documents
  const testWeight = corpus.getCollectionFrequencyWeight('test');
  const shortWeight = corpus.getCollectionFrequencyWeight('short');
  t.ok(testWeight < shortWeight);

  const topTerms = corpus.getTopTermsForDocument('document3');
  // Terms after stopword filtering: ['test', 'document', 'number', 'three', 'bit', 'different',
  // 'also', 'tiny', 'longer']
  t.equal(topTerms.length, 9);
  // 'bit' should have the highest weight, because it appears twice in document 3 and only there
  t.equal(topTerms[0][0], 'bit');

  const queryResults = corpus.getResultsForQuery('a bit of a test query');
  // All documents should match this query (because of the term 'test')
  t.equal(queryResults.length, 3);
  // Document 3 should be the highest ranked (because of the term 'bit')
  t.equal(queryResults[0][0], 'document3');
  // We should guard against a query that is empty or is not a string
  t.equal(corpus.getResultsForQuery('').length, 0);
  t.equal(corpus.getResultsForQuery(2).length, 0);
});

tape('Unit tests for Document class', function (t) {
  t.plan(4);
  const doc = corpus.getDocument('document3');

  const terms = doc.getUniqueTerms();
  // We have ignored short terms (<2 characters except 'i' and 'a') and stripped pure numbers,
  // and have not yet applied stopword filtering. So unique terms are ['test', 'document', 'number',
  // 'three', 'is', 'a', 'bit', 'different', 'and', 'also', 'tiny', 'longer']
  t.equal(terms.length, 12);

  t.equal(doc.getTermFrequency('bit'), 2);
  t.equal(doc.getTermFrequency('and'), 1); // stopwords are still present at the document level
  t.equal(doc.getTermFrequency('a'), 2); // 'a' is now preserved as a single-letter token
});

tape('Unit tests for Similarity class', function (t) {
  t.plan(2);
  const similarity = new Similarity(corpus);
  const distanceMatrix = similarity.getDistanceMatrix();
  t.equal(distanceMatrix.identifiers.length, 3);
  // The first two documents should be more similar to each other (i.e. less distant) than the
  // first and third.
  t.ok(distanceMatrix.matrix[0][1] < distanceMatrix.matrix[0][2]);
});

tape('Unit tests for Stopwords class', function (t) {
  t.plan(11);
  const customStopwords = ['test', 'words'];

  const defaultPlusCustomStopwords = new Stopwords(true, customStopwords);
  t.ok(defaultPlusCustomStopwords.includes('test'));
  t.ok(defaultPlusCustomStopwords.includes('words'));
  t.ok(defaultPlusCustomStopwords.includes('the'));
  // 'a' and 'i' should be in default stopwords
  t.ok(defaultPlusCustomStopwords.includes('a'));
  t.ok(defaultPlusCustomStopwords.includes('i'));

  const emptyStopwords = new Stopwords(false, []);
  t.notOk(emptyStopwords.includes('test'));
  t.notOk(emptyStopwords.includes('words'));
  t.notOk(emptyStopwords.includes('the'));

  const customStopwordsOnly = new Stopwords(false, customStopwords);
  t.ok(customStopwordsOnly.includes('test'));
  t.ok(customStopwordsOnly.includes('words'));
  t.notOk(customStopwordsOnly.includes('the'));
});

tape('Unit tests for tokenization (Issue #3)', function (t) {
  t.plan(7);

  // Test alphanumeric tokens like "2nd" are preserved
  const corpus1 = new Corpus(['doc1'], ['I was the 2nd person to see a dog']);
  const doc1 = corpus1.getDocument('doc1');
  const terms1 = doc1.getUniqueTerms();
  t.ok(terms1.includes('2nd'), '"2nd" should be preserved as a token');
  t.ok(terms1.includes('i'), '"I" should be preserved (lowercased to "i")');
  t.ok(terms1.includes('a'), '"a" should be preserved');

  // Test that 'i' and 'a' are in default stopwords so they get filtered at corpus level
  const corpusTerms1 = corpus1.getTerms();
  t.notOk(corpusTerms1.includes('i'), '"i" should be filtered by stopwords');
  t.notOk(corpusTerms1.includes('a'), '"a" should be filtered by stopwords');

  // Test pure numeric tokens are filtered
  const corpus2 = new Corpus(['doc2'], ['There are 123 items']);
  const doc2 = corpus2.getDocument('doc2');
  const terms2 = doc2.getUniqueTerms();
  t.notOk(terms2.includes('123'), 'Pure numeric token "123" should be filtered');

  // Test that single letters other than 'i' and 'a' are still filtered
  const corpus3 = new Corpus(['doc3'], ["won't it's"]);
  const doc3 = corpus3.getDocument('doc3');
  const terms3 = doc3.getUniqueTerms();
  t.notOk(terms3.includes('t') || terms3.includes('s'), 'Single letters from contractions should be filtered');
});

import { Corpus, Stopwords } from './index.js';
import tape from 'tape';

tape('Unit tests for Corpus class', function (t) {
  t.plan(7);
  const stopwords = new Stopwords();
  const stopwordFilter = term => !stopwords.includes(term);
  const corpus = new Corpus(
    ['document1', 'document2', 'document3'],
    [
      'This is test document number 1. It is quite a short document.',
      'This is test document 2. It is also quite short, and is a test.',
      'Test document number three is a bit different and is also a tiny bit longer.'
    ]
  );
  const n = corpus.getDocumentIdentifiers().length;
  t.equal(n, 3);
  const doc = corpus.getDocument('document3');
  const terms = doc.getUniqueTerms(stopwordFilter);
  // We have ignored short terms and stripped numbers, and stopword filtering has removed 'and', but TFIDF has not been applied yet
  t.deepEqual(terms, ['test', 'document', 'number', 'three', 'bit', 'different', 'also', 'tiny', 'longer']);
  const topTerms = corpus.getTopTermsForDocument('document3');
  console.log(topTerms);
  // An IDF weight of 0 means that 'test' and 'document' are gone, and stopword filtering has removed 'and'
  t.equal(topTerms.length, 7);
  // 'bit' should have the highest weight, because it appears twice in document 3 and only in that document
  t.equal(topTerms[0][0], 'bit');
  t.equal(corpus.getTotalLength(stopwordFilter), 22);

  const queryResults = corpus.getResultsForQuery('a bit of a test query');
  // Document 3 should be the only match for this query (because of the term 'bit' - 'test' has been removed by IDF)
  t.equal(queryResults.length, 1);
  t.equal(queryResults[0][0], 'document3');
});

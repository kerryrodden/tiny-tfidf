import { Corpus } from './index.js';
import tape from 'tape';

tape('Unit tests for Corpus class', function (t) {
  t.plan(4);
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
  const terms = doc.getUniqueTerms();
  // We have ignored short terms and stripped numbers, but IDF and stopword filtering have not been applied yet
  t.deepEqual(terms, ['test', 'document', 'number', 'three', 'bit', 'different', 'and', 'also', 'tiny', 'longer']);
  const topTerms = corpus.getTopTermsForDocument('document3');
  // An IDF weight of 0 means that 'test' and 'document' are gone, and stopword filtering has removed 'and'
  t.equal(topTerms.length, 7);
  // 'bit' should have the highest weight, because it appears twice in document 3 and only in that document
  t.equal(topTerms[0][0], 'bit');
});

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

tape('Unit tests for new options API and backward compatibility', function (t) {
  t.plan(11);

  const names = ['doc1', 'doc2'];
  const texts = ['This is a test', 'Another test document'];

  // Test new options object API
  const corpus1 = new Corpus(names, texts, {
    useDefaultStopwords: true,
    customStopwords: ['test'],
    K1: 1.5,
    b: 0.5
  });
  t.ok(corpus1, 'Corpus created with new options API');
  t.notOk(corpus1.getTerms().includes('test'), 'Custom stopword "test" should be filtered');

  // Test new API with partial options (relying on defaults)
  const corpus2 = new Corpus(names, texts, { customStopwords: ['document'] });
  t.ok(corpus2, 'Corpus created with partial options');
  t.notOk(corpus2.getTerms().includes('document'), 'Custom stopword "document" should be filtered');

  // Test new API with empty options (all defaults)
  const corpus3 = new Corpus(names, texts);
  t.ok(corpus3, 'Corpus created with default options');
  t.ok(corpus3.getTerms().includes('test'), 'Default stopwords should be used');

  // Test backward compatibility with v0.9 API
  const corpus4 = new Corpus(names, texts, true, ['test'], 1.5, 0.5);
  t.ok(corpus4, 'Corpus created with v0.9 API signature');
  t.notOk(corpus4.getTerms().includes('test'), 'v0.9 API custom stopword should work');

  // Test backward compatibility with partial v0.9 parameters
  const corpus5 = new Corpus(names, texts, false);
  t.ok(corpus5, 'Corpus created with partial v0.9 API');
  t.ok(corpus5.getTerms().includes('is'), 'No default stopwords should be used');

  // Verify both APIs produce equivalent results
  const corpus6a = new Corpus(names, texts, true, ['custom'], 2.0, 0.75);
  const corpus6b = new Corpus(names, texts, { useDefaultStopwords: true, customStopwords: ['custom'], K1: 2.0, b: 0.75 });
  t.equal(
    corpus6a.getTerms().length,
    corpus6b.getTerms().length,
    'Old and new API should produce equivalent results'
  );
});

tape('Unit tests for empty string documents (Issue #5)', function (t) {
  t.plan(6);

  // Test that corpus can be created with empty string documents
  const corpus = new Corpus(['doc1', 'doc2', 'doc3'], ['This is a test', '', 'Another document']);
  t.equal(corpus.getDocumentIdentifiers().length, 3, 'Corpus should have 3 documents');

  // Test that empty document has no terms
  const emptyDoc = corpus.getDocument('doc2');
  t.equal(emptyDoc.getUniqueTerms().length, 0, 'Empty document should have no terms');
  t.equal(emptyDoc.getLength(), 0, 'Empty document should have length 0');

  // Test that corpus operations work with empty documents
  const corpusTerms = corpus.getTerms();
  t.ok(corpusTerms.includes('test'), 'Corpus should still include terms from non-empty documents');

  const topTerms = corpus.getTopTermsForDocument('doc2');
  t.equal(topTerms.length, 0, 'Empty document should have no top terms');

  // Test that queries work with empty documents in corpus
  const queryResults = corpus.getResultsForQuery('test');
  t.ok(queryResults.length > 0, 'Queries should work with empty documents in corpus');
});

tape('Unit tests for addDocument() method (Issue #4)', function (t) {
  t.plan(10);

  // Create initial corpus with 2 documents
  const corpus = new Corpus(['doc1', 'doc2'], ['This is a test', 'Another test document']);
  const initialDocCount = corpus.getDocumentIdentifiers().length;
  const initialTermCount = corpus.getTerms().length;

  t.equal(initialDocCount, 2, 'Initial corpus should have 2 documents');

  // Add a new document
  const added = corpus.addDocument('doc3', 'A completely new document with unique terms');
  t.ok(added, 'addDocument should return true when adding new document');
  t.equal(corpus.getDocumentIdentifiers().length, 3, 'Corpus should now have 3 documents');

  // Verify the new document is accessible
  const newDoc = corpus.getDocument('doc3');
  t.ok(newDoc, 'New document should be accessible');
  t.ok(newDoc.getUniqueTerms().includes('unique'), 'New document should contain its terms');

  // Verify corpus terms are recalculated
  const newTerms = corpus.getTerms();
  t.ok(newTerms.includes('unique'), 'Corpus terms should include terms from new document');
  t.ok(newTerms.length > initialTermCount, 'Corpus should have more terms after adding document');

  // Verify TF-IDF calculations work with the new document
  const topTerms = corpus.getTopTermsForDocument('doc3');
  t.ok(topTerms.length > 0, 'Should be able to get top terms for new document');

  // Test that adding duplicate identifier returns false
  const duplicate = corpus.addDocument('doc3', 'Different text');
  t.notOk(duplicate, 'addDocument should return false for duplicate identifier');
  t.equal(corpus.getDocumentIdentifiers().length, 3, 'Corpus should still have 3 documents');
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

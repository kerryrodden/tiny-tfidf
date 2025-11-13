import { Corpus, Similarity, Stopwords } from './index.js';
import tape from 'tape';

// Shared test corpus for basic tests
const testCorpus = new Corpus(
  ['document1', 'document2', 'document3'],
  [
    'This is test document number 1. It is quite a short document.',
    'This is test document 2. It is also quite short, and is a test.',
    'Test document number three is a bit different and is also a tiny bit longer.'
  ]
);

tape('Corpus class - basic functionality', function (t) {
  t.plan(15);

  t.equal(testCorpus.getDocumentIdentifiers().length, 3, 'Corpus should have 3 documents');

  const terms = testCorpus.getTerms();
  t.ok(terms.includes('test'), 'Terms should include "test"');
  t.ok(terms.includes('short'), 'Terms should include "short"');
  t.notOk(terms.includes('1'), 'Terms should not include pure number "1"');
  t.notOk(terms.includes('a'), 'Terms should not include stopword "a"');
  t.notOk(terms.includes('and'), 'Terms should not include stopword "and"');

  t.equal(testCorpus.getCollectionFrequency('test'), 3, '"test" should appear in 3 documents');
  t.equal(testCorpus.getCollectionFrequency('short'), 2, '"short" should appear in 2 documents');
  t.equal(testCorpus.getCollectionFrequency('and'), null, 'Stopword "and" should return null frequency');

  const topTwo = testCorpus.getCommonTerms('document1', 'document2').map(d => d[0]).slice(0, 2).sort();
  t.ok(topTwo[0] === 'quite' && topTwo[1] === 'short', 'Top common terms for doc1 and doc2 should be "quite" and "short"');

  const testWeight = testCorpus.getCollectionFrequencyWeight('test');
  const shortWeight = testCorpus.getCollectionFrequencyWeight('short');
  t.ok(testWeight < shortWeight, '"test" should have lower weight than "short" (appears in more documents)');

  const topTerms = testCorpus.getTopTermsForDocument('document3');
  t.equal(topTerms.length, 9, 'Document 3 should have 9 non-stopword terms');
  t.equal(topTerms[0][0], 'bit', '"bit" should have highest weight in document 3 (appears twice, unique to doc3)');

  const queryResults = testCorpus.getResultsForQuery('a bit of a test query');
  t.equal(queryResults.length, 3, 'Query should match all 3 documents');
  t.equal(queryResults[0][0], 'document3', 'Document 3 should rank highest for query with "bit" and "test"');
});

tape('Corpus class - query edge cases', function (t) {
  t.plan(2);

  t.equal(testCorpus.getResultsForQuery('').length, 0, 'Empty query should return no results');
  t.equal(testCorpus.getResultsForQuery(2).length, 0, 'Non-string query should return no results');
});

tape('Corpus class - constructor options and backward compatibility', function (t) {
  t.plan(11);

  const names = ['doc1', 'doc2'];
  const texts = ['This is a test', 'Another test document'];

  const corpus1 = new Corpus(names, texts, {
    useDefaultStopwords: true,
    customStopwords: ['test'],
    K1: 1.5,
    b: 0.5
  });
  t.ok(corpus1, 'Corpus should be created with options object API');
  t.notOk(corpus1.getTerms().includes('test'), 'Custom stopword should be filtered');

  const corpus2 = new Corpus(names, texts, { customStopwords: ['document'] });
  t.ok(corpus2, 'Corpus should be created with partial options');
  t.notOk(corpus2.getTerms().includes('document'), 'Custom stopword from partial options should be filtered');

  const corpus3 = new Corpus(names, texts);
  t.ok(corpus3, 'Corpus should be created with default options');
  t.ok(corpus3.getTerms().includes('test'), 'Non-stopword should be included with defaults');

  const corpus4 = new Corpus(names, texts, true, ['test'], 1.5, 0.5);
  t.ok(corpus4, 'Corpus should be created with v0.9 positional parameters');
  t.notOk(corpus4.getTerms().includes('test'), 'Custom stopword should work with v0.9 API');

  const corpus5 = new Corpus(names, texts, false);
  t.ok(corpus5, 'Corpus should be created with partial v0.9 parameters');
  t.ok(corpus5.getTerms().includes('is'), 'Stopwords should not be used when disabled');

  const corpus6a = new Corpus(names, texts, true, ['custom'], 2.0, 0.75);
  const corpus6b = new Corpus(names, texts, { useDefaultStopwords: true, customStopwords: ['custom'], K1: 2.0, b: 0.75 });
  t.equal(corpus6a.getTerms().length, corpus6b.getTerms().length, 'v0.9 and v1.0 APIs should produce identical results');
});

tape('Corpus class - addDocument method', function (t) {
  t.plan(10);

  const corpus = new Corpus(['doc1', 'doc2'], ['This is a test', 'Another test document']);
  const initialTermCount = corpus.getTerms().length;

  const added = corpus.addDocument('doc3', 'A completely new document with unique terms');
  t.ok(added, 'addDocument should return true when successful');
  t.equal(corpus.getDocumentIdentifiers().length, 3, 'Corpus should have 3 documents after adding one');

  const newDoc = corpus.getDocument('doc3');
  t.ok(newDoc, 'Added document should be retrievable');
  t.ok(newDoc.getUniqueTerms().includes('unique'), 'Added document should contain its terms');

  const newTerms = corpus.getTerms();
  t.ok(newTerms.includes('unique'), 'Corpus terms should include terms from added document');
  t.ok(newTerms.length > initialTermCount, 'Corpus should have more terms after adding document');

  const topTerms = corpus.getTopTermsForDocument('doc3');
  t.ok(topTerms.length > 0, 'Should be able to get TF-IDF scores for added document');

  const duplicate = corpus.addDocument('doc3', 'Different text');
  t.notOk(duplicate, 'addDocument should return false for duplicate identifier');
  t.equal(corpus.getDocumentIdentifiers().length, 3, 'Corpus should still have 3 documents after duplicate attempt');

  const emptyCorpus = new Corpus([], []);
  emptyCorpus.addDocument('first', 'This is the first document');
  emptyCorpus.addDocument('second', 'This is the second document with more words');
  t.ok(emptyCorpus.getTopTermsForDocument('first').length > 0, 'Should be able to build corpus incrementally from empty');
});

tape('Corpus class - empty document handling', function (t) {
  t.plan(5);

  const corpus = new Corpus(['doc1', 'doc2', 'doc3'], ['This is a test', '', 'Another document']);
  t.equal(corpus.getDocumentIdentifiers().length, 3, 'Corpus should accept empty string documents');

  const emptyDoc = corpus.getDocument('doc2');
  t.equal(emptyDoc.getUniqueTerms().length, 0, 'Empty document should have no terms');
  t.equal(emptyDoc.getLength(), 0, 'Empty document should have length 0');

  t.ok(corpus.getTerms().includes('test'), 'Corpus operations should work with empty documents present');

  const topTerms = corpus.getTopTermsForDocument('doc2');
  t.equal(topTerms.length, 0, 'Empty document should have no top terms');
});

tape('Document class - basic functionality', function (t) {
  t.plan(4);

  const doc = testCorpus.getDocument('document3');
  const terms = doc.getUniqueTerms();

  t.equal(terms.length, 12, 'Document should have 12 unique terms (including stopwords, after tokenization)');
  t.equal(doc.getTermFrequency('bit'), 2, '"bit" should appear 2 times in document');
  t.equal(doc.getTermFrequency('and'), 1, 'Stopword "and" should be present at document level');
  t.equal(doc.getTermFrequency('a'), 2, 'Single letter "a" should be preserved and appear 2 times');
});

tape('Document class - tokenization', function (t) {
  t.plan(5);

  const corpus1 = new Corpus(['doc1'], ['I was the 2nd person to see a dog']);
  const doc1 = corpus1.getDocument('doc1');
  const terms1 = doc1.getUniqueTerms();

  t.ok(terms1.includes('2nd'), 'Alphanumeric token "2nd" should be preserved');
  t.ok(terms1.includes('i'), 'Single letter "I" should be preserved (lowercased)');

  const corpusTerms1 = corpus1.getTerms();
  t.notOk(corpusTerms1.includes('i'), 'Single letter "i" should be filtered by stopwords at corpus level');

  const corpus2 = new Corpus(['doc2'], ['There are 123 items']);
  const doc2 = corpus2.getDocument('doc2');
  t.notOk(doc2.getUniqueTerms().includes('123'), 'Pure numeric token "123" should be filtered');

  const corpus3 = new Corpus(['doc3'], ["won't it's"]);
  const doc3 = corpus3.getDocument('doc3');
  const terms3 = doc3.getUniqueTerms();
  t.notOk(terms3.includes('t') || terms3.includes('s'), 'Single letter fragments from contractions should be filtered');
});

tape('Similarity class - distance matrix', function (t) {
  t.plan(2);

  const similarity = new Similarity(testCorpus);
  const distanceMatrix = similarity.getDistanceMatrix();

  t.equal(distanceMatrix.identifiers.length, 3, 'Distance matrix should have 3 identifiers');
  t.ok(distanceMatrix.matrix[0][1] < distanceMatrix.matrix[0][2], 'Documents 1 and 2 should be more similar than documents 1 and 3');
});

tape('Stopwords class - configuration options', function (t) {
  t.plan(10);

  const customStopwords = ['test', 'words'];

  const defaultPlusCustom = new Stopwords(true, customStopwords);
  t.ok(defaultPlusCustom.includes('test'), 'Should include custom stopword "test"');
  t.ok(defaultPlusCustom.includes('words'), 'Should include custom stopword "words"');
  t.ok(defaultPlusCustom.includes('the'), 'Should include default stopword "the"');
  t.ok(defaultPlusCustom.includes('i'), 'Should include default stopword "i"');

  const emptyStopwords = new Stopwords(false, []);
  t.notOk(emptyStopwords.includes('test'), 'Empty stopwords should not include "test"');
  t.notOk(emptyStopwords.includes('words'), 'Empty stopwords should not include "words"');
  t.notOk(emptyStopwords.includes('the'), 'Empty stopwords should not include default "the"');

  const customOnly = new Stopwords(false, customStopwords);
  t.ok(customOnly.includes('test'), 'Custom-only should include "test"');
  t.ok(customOnly.includes('words'), 'Custom-only should include "words"');
  t.notOk(customOnly.includes('the'), 'Custom-only should not include default "the"');
});

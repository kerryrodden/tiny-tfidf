import { Corpus } from './index.js';
import tape from 'tape';

tape('Unit tests for Corpus class', function (t) {
  t.plan(4);
  const corpus = new Corpus(
    ["doc-1", "doc-2", "doc-3"],
    [
      "text1 for first document document 1-1 text1 for document 1-2",
      "text2 for second document aa document 2-2 text2 for document 2-2 text2 for document 2-3",
      "text3 for third document bb ccccc document 3-1"
    ]
  );
  const n = corpus.getDocumentIdentifiers().length;
  t.equal(n, 3);
  const doc = corpus.getDocument("doc-2");
  const terms = doc.getUniqueTerms();
  // We have ignored short terms and stripped numbers, but stopword filtering has not been applied yet
  t.deepEqual(terms, ["text", "for", "second", "document"]);
  const topTerms = corpus.getTopTermsForDocument("doc-2");
  // Stopword filtering has been applied so "for" is now gone
  t.equal(topTerms.length, 3);
  // "second" should have the highest weight
  t.equal(topTerms[0][0], "second");
});

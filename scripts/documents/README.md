# Study documents

`build_documents.py` turns the three original documents into the reading text for the course's Lecturas (`src/content/documents/{guia,confesion,orden}.json`). It's run by hand when a document changes; the app only reads the JSON.

```
pip install pdfplumber        # pandoc must also be installed
python scripts/documents/build_documents.py \
  "Documento maestro Guia de Liderazgo.docx" \
  "PRESBITERIANOS Confesion de Fe y Catecismo Menor.pdf" \
  "Libro de Orden 2018.pdf" \
  src/content/documents
```

What it does:

- **Guía** (docx, via pandoc): `#` headings become parts, `##` become chapters, `####` subheadings, `######` (and block quotes) quotations; tables become rows; footnotes are listed under «Notas» at the end of the chapter. The ordination date of José Felices is corrected from «1812» to «1912».
- **Confesión** (pdf): the prologue, the 35 chapters (titles taken from the edition's index, with accents restored) with the proof texts under each paragraph, and the Catecismo Menor grouped by topic (preguntas 1–3, 4–12, …). The book list in 1.2 is rewritten as two plain lists because the PDF lays it out in columns.
- **Libro de orden** (pdf): Prefacio, Los esenciales de nuestra fe, and the three books by chapter. Running headers, page numbers and the table of contents are dropped; footnotes that only say «Modificación ratificada en …» are removed, the others are kept under «Notas».

Each Lectura on the Course tab of the spreadsheet points at a First Chapter and Last Chapter id from these JSON files. After rebuilding, run `npm run sync-content`: it fails if a Lectura points at a chapter id that no longer exists. Then skim a few chapters in the app. (The Catecismo Menor is still in `confesion.json` but no Lectura uses it.)

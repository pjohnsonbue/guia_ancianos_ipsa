#!/usr/bin/env python3
"""Builds the «Documentos de estudio» reader content from the original files.

    python3 build_documents.py <guia.docx> <confesion.pdf> <libro-de-orden.pdf> <outdir>

Writes <outdir>/{guia,confesion,orden}.json with this shape:

    { "id", "title", "parts": [ { "title", "chapters": [ { "id", "title", "blocks": [...] } ] } ] }

Blocks are short arrays: ["h", text] subheading, ["p", text] paragraph,
["q", text] quotation, ["li", text] list item, ["refs", text] proof texts,
["note", text] footnote, ["row", [cell, ...]] table row.
Inline emphasis uses **bold** and *italic*.
Needs: pandoc, pdfplumber.
"""
import json, re, subprocess, sys
import pdfplumber

SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def tidy(s):
    s = s.replace(" ", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\*\*\s*\*\*", "", s)
    s = re.sub(r"(?<!\*)\*\s*\*(?!\*)", "", s)
    return s.strip()


def slug(s):
    s = s.lower()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]


# ---------------------------------------------------------------------------
# Guía (docx via pandoc JSON)
# ---------------------------------------------------------------------------
def build_guia(path):
    ast = json.loads(subprocess.check_output(["pandoc", path, "-t", "json"]))
    notes = []

    def inl(xs):
        out = []
        for x in xs:
            t, c = x["t"], x.get("c")
            if t == "Str":
                out.append(c.replace("*", "∗"))
            elif t in ("Space", "SoftBreak"):
                out.append(" ")
            elif t == "LineBreak":
                out.append("\n")
            elif t == "Emph":
                out.append("*" + inl(c).strip() + "*" if inl(c).strip() else "")
            elif t == "Strong":
                out.append("**" + inl(c).strip() + "**" if inl(c).strip() else "")
            elif t in ("Underline", "SmallCaps", "Strikeout", "Superscript", "Subscript"):
                out.append(inl(c))
            elif t == "Span":
                out.append(inl(c[1]))
            elif t == "Link":
                out.append(inl(c[1]))
            elif t == "Quoted":
                q = "“%s”" if c[0]["t"] == "DoubleQuote" else "‘%s’"
                out.append(q % inl(c[1]))
            elif t == "Code":
                out.append(c[1])
            elif t == "Note":
                notes.append(" ".join(blocktext(b) for b in c))
                out.append(str(len(notes)).translate(SUP))
        return "".join(out)

    def blocktext(b):
        if b["t"] in ("Para", "Plain"):
            return inl(b["c"])
        if b["t"] == "BlockQuote":
            return " ".join(blocktext(x) for x in b["c"])
        return ""

    doc = {"id": "guia", "title": "Guía de Formación de Liderazgo", "parts": []}
    part = chap = None
    pending_intro = []

    def new_chapter(title):
        nonlocal chap
        chap = {"title": title, "blocks": []}
        part["chapters"].append(chap)

    def add(block):
        if part is None:
            return
        if chap is None:
            new_chapter(part["title"])
        if block[1] if isinstance(block[1], str) else True:
            chap["blocks"].append(block)

    def flush_notes():
        if chap is not None and notes:
            chap["blocks"].append(["h", "Notas"])
            for i, n in enumerate(notes, 1):
                chap["blocks"].append(["note", f"{str(i).translate(SUP)} {tidy(n)}"])
        notes.clear()

    def walk(blocks, quote=False):
        nonlocal part, chap
        for b in blocks:
            t, c = b["t"], b.get("c")
            if t == "Header":
                level, text = c[0], tidy(inl(c[2]).replace("**", "").replace("*", ""))
                if level == 1:
                    flush_notes()
                    if not text or text == "ÍNDICE":
                        part = None if text == "ÍNDICE" else part
                        continue
                    text = re.sub(r"^[IVX]+\.\s*", "", text)
                    part = {"title": text, "chapters": []}
                    doc["parts"].append(part)
                    chap = None
                elif level == 2:
                    if part is None or not text:
                        continue
                    flush_notes()
                    new_chapter(re.sub(r"^[A-Z]\.\s+", "", text))
                elif level == 6:
                    add(["q", tidy(inl(c[2]))])
                else:
                    if text:
                        add(["h", text])
            elif t in ("Para", "Plain"):
                s = tidy(inl(c))
                if s:
                    add(["q" if quote else "p", s])
            elif t == "BlockQuote":
                walk(c, quote=True)
            elif t in ("BulletList", "OrderedList"):
                items = c if t == "BulletList" else c[1]
                start = 1 if t == "BulletList" else c[0][0]
                for i, item in enumerate(items):
                    s = tidy(" ".join(blocktext(x) for x in item if x["t"] in ("Para", "Plain")))
                    if s:
                        add(["li", ("• " if t == "BulletList" else f"{start + i}. ") + s])
                    rest = [x for x in item if x["t"] not in ("Para", "Plain")]
                    if rest:
                        walk(rest, quote)
            elif t == "Table":
                # pandoc >= 2.10 table: [attr, caption, colspecs, head, bodies, foot]
                def rows_of(section_rows):
                    for r in section_rows:
                        cells = [tidy(" ".join(blocktext(x) for x in cell[4])) for cell in r[1]]
                        cells = [x for x in cells if x]
                        if cells:
                            add(["row", cells])
                rows_of(c[3][1])
                for body in c[4]:
                    rows_of(body[2])
                    rows_of(body[3])
            elif t == "Div":
                walk(c[1], quote)
        flush_notes()

    walk(ast["blocks"])
    # Confirmed with the editors: Felices was ordained in 1912 (the docx says 1812).
    for p in doc["parts"]:
        for ch in p["chapters"]:
            for blk in ch["blocks"]:
                if isinstance(blk[1], str):
                    blk[1] = blk[1].replace("Abril de 1812", "Abril de 1912")
    return doc


# ---------------------------------------------------------------------------
# PDF helpers
# ---------------------------------------------------------------------------
def styled_text(chars, body_size, skip_small=True, on_sup=None):
    """Rebuild a line's text with **bold** / *italic* runs; superscripts go to on_sup."""
    out, run, style, prev = [], [], "", None
    sup = []

    def flush():
        if run:
            s = "".join(run)
            core = s.strip()
            if core and style:
                mark = {"b": "**", "i": "*", "bi": "**"}[style]
                lead = s[: len(s) - len(s.lstrip())]
                trail = s[len(s.rstrip()):]
                out.append(lead + mark + core + mark + trail)
            else:
                out.append(s)
            run.clear()

    for ch in chars:
        small = ch["size"] < body_size * 0.82
        if small and skip_small:
            if ch["text"].isdigit():
                sup.append(ch["text"])
            continue
        if sup:
            if on_sup:
                flush()
                out.append(on_sup("".join(sup)))
            sup = []
        txt = ch["text"]
        if prev is not None and txt != " " and run and run[-1] != " ":
            gap = ch["x0"] - prev["x1"]
            if gap > ch["size"] * 0.22:
                run.append(" ")
        fn = ch["fontname"]
        st = ("b" if "Bold" in fn else "") + ("i" if "Italic" in fn else "")
        if st == "bi":
            st = "b"
        if st != style and txt.strip():
            # keep a trailing space with the previous run
            flush()
            style = st
        run.append(txt)
        prev = ch
    if sup and on_sup:
        flush()
        out.append(on_sup("".join(sup)))
    flush()
    s = "".join(out)
    s = re.sub(r"\*\*(\s*)\*\*", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def join_lines(lines):
    text = ""
    for l in lines:
        if text.endswith("-") and l[:1].islower():
            text = text[:-1] + l
        else:
            text = (text + " " + l) if text else l
    s = re.sub(r"\*\*\s+\*\*", " ", text)
    s = re.sub(r"(?<!\*)\*\s+\*(?!\*)", " ", s)
    return tidy(s)


def plain(s):
    return s.replace("**", "").replace("*", "")


# ---------------------------------------------------------------------------
# Libro de orden
# ---------------------------------------------------------------------------
STARTERS = re.compile(r"^(\*\*)?(§\s?\d+-\d+|[A-Z]\.\s|\d+\.\s|[a-z]\)\s|\d+\)\s|“\s?Considerando)")


def build_orden(path):
    pdf = pdfplumber.open(path)
    doc = {"id": "orden", "title": "Libro de orden", "parts": []}
    part = chap = None
    notes_used = []
    para, para_bottom, para_size = [], None, None
    pending_title = None  # "CAPÍTULO n" waiting for its title
    pending_sec = None  # a lone "§x-y" line waiting for its caption

    def flush_para():
        nonlocal para
        if para and chap is not None:
            s = join_lines(para)
            p = plain(s)
            if s.startswith("**") and s.endswith("**") and len(p) < 120:
                chap["blocks"].append(["h", p])
            elif re.fullmatch(r"§\s?\d+-\d+", p):
                chap["blocks"].append(["h", p])
            else:
                chap["blocks"].append(["p", s])
        para = []

    def flush_notes():
        if chap is not None and notes_used:
            chap["blocks"].append(["h", "Notas"])
            for n, t in notes_used:
                chap["blocks"].append(["note", f"{n.translate(SUP)} {t}"])
        notes_used.clear()

    def new_part(title):
        nonlocal part, chap
        flush_para(); flush_notes()
        part = {"title": title, "chapters": []}
        doc["parts"].append(part)
        chap = None

    def new_chap(title):
        nonlocal chap
        flush_para(); flush_notes()
        chap = {"title": title, "blocks": []}
        part["chapters"].append(chap)

    for pn, page in enumerate(pdf.pages):
        if pn in (0, 2, 3):  # cover and table of contents
            continue
        if pn >= 91:  # thematic index
            break
        lines = page.extract_text_lines(return_chars=True)
        # Footnotes on this page: size ~6.5.
        foot = {}
        cur = None
        for l in lines:
            if l["chars"][0]["size"] < 7.5 and l["top"] > 500:
                m = re.match(r"^(\d+)\s+(.*)", l["text"])
                if m:
                    cur = m.group(1)
                    foot[cur] = m.group(2)
                elif cur:
                    foot[cur] += " " + l["text"]

        def on_sup(num):
            t = foot.get(num, "").strip()
            if not t or t.lower().startswith("modificación") or t.lower().startswith("modificacion"):
                return ""
            notes_used.append((num, tidy(t)))
            return num.translate(SUP)

        for l in lines:
            c0 = l["chars"][0]
            size = round(c0["size"], 1)
            top = l["top"]
            if top < 60 and size <= 10.5:
                continue  # running header
            if size < 7.5:
                continue  # footnotes (collected above)
            if top > 740 and l["text"].strip().isdigit():
                continue  # page number
            raw = l["text"].strip()
            bold = sum("Bold" in ch["fontname"] for ch in l["chars"]) / len(l["chars"]) > 0.6
            if size >= 15.5:
                if raw.startswith("SECCIÓN"):
                    continue
                if raw == "Prefacio":
                    new_part("Prefacio"); new_chap("Prefacio"); continue
                if raw == "Documento":
                    continue
                if raw.startswith("Los esenciales"):
                    new_part("Los esenciales de nuestra fe"); new_chap("Los esenciales de nuestra fe"); continue
                if raw.startswith("Libro de"):
                    new_part(raw); continue
                continue
            if size >= 13.5:
                if raw.startswith("CAPÍTULO"):
                    flush_para(); flush_notes()
                    pending_title = raw.title().replace("Capítulo", "Capítulo")
                    chap = None
                    continue
                if pending_title is not None:
                    new_chap(f"{pending_title} · {raw}")
                    pending_title = None
                    continue
                if chap is not None and chap["blocks"] == [] and chap["title"].count("·") == 1:
                    chap["title"] += " " + raw  # wrapped chapter title
                    continue
            if chap is None:
                continue
            if re.fullmatch(r"§\s?\d+-\d+", raw):
                flush_para()
                pending_sec = raw
                continue
            letters = [ch for ch in raw if ch.isalpha()]
            if bold and letters and sum(ch.isupper() for ch in letters) / len(letters) > 0.85 and len(raw) < 110:
                flush_para()
                m = re.match(r"^(§\s?\d+-\d+\s+)?(.*?)\d*$", raw)
                lead, cap = (m.group(1) or ""), m.group(2)
                title = cap[:1].upper() + cap[1:].lower()
                chap["blocks"].append(["h", (pending_sec + " " if pending_sec else "") + lead + title])
                pending_sec = None
                para_bottom = None
                continue
            if pending_sec:
                flush_para()
                chap["blocks"].append(["h", pending_sec])
                pending_sec = None
            body = 12 if size >= 11.5 else (11 if size >= 10.5 else 10)
            s = styled_text(l["chars"], body, on_sup=on_sup)
            if not s:
                continue
            gap = (top - para_bottom) if para_bottom is not None else 99
            new = (not para) or gap > body * 1.55 or gap < -50 or STARTERS.match(s) or size != para_size
            if new:
                flush_para()
            para.append(s)
            para_bottom, para_size = l["bottom"], size
        para_bottom = None  # paragraphs may continue across pages; gap check resets
    flush_para(); flush_notes()
    return doc


# ---------------------------------------------------------------------------
# Confesión de fe + Catecismo Menor
# ---------------------------------------------------------------------------
CFW_TITLES = [
    "De las Santas Escrituras", "De Dios y de la Santísima Trinidad", "Del decreto eterno de Dios",
    "De la creación", "De la providencia", "De la caída del hombre, del pecado y su castigo",
    "Del pacto de Dios con el hombre", "De Cristo, el Mediador", "Del libre albedrío",
    "Del llamamiento eficaz", "De la justificación", "De la adopción", "De la santificación",
    "De la fe salvadora", "Del arrepentimiento para vida", "De las buenas obras",
    "De la perseverancia de los santos", "De la seguridad de la gracia y de la salvación",
    "De la ley de Dios", "De la libertad cristiana y de la libertad de conciencia",
    "De la adoración religiosa y del día de reposo", "De los juramentos y de los votos válidos",
    "Del magistrado civil", "Del matrimonio y del divorcio", "De la iglesia",
    "De la comunión de los santos", "De los sacramentos", "Del bautismo", "De la Cena del Señor",
    "De la disciplina eclesiástica", "De los sínodos y concilios", "De la muerte y la resurrección",
    "Del juicio final", "Del Espíritu Santo", "Del evangelio del amor de Dios y las misiones",
]
CATECHISM_GROUPS = [
    (1, 3, "El fin del hombre y la Escritura"), (4, 12, "Dios, sus decretos y la creación"),
    (13, 20, "La caída y el pacto de gracia"), (21, 28, "Cristo, el Redentor"),
    (29, 38, "La obra del Espíritu y los beneficios de la redención"),
    (39, 62, "La ley de Dios: los mandamientos 1 a 4"), (63, 81, "Los mandamientos 5 a 10"),
    (82, 90, "El pecado, la fe, el arrepentimiento y la Palabra"), (91, 97, "Los sacramentos"),
    (98, 107, "La oración"),
]
BOOKS_OT = "Génesis, Éxodo, Levítico, Números, Deuteronomio, Josué, Jueces, Rut, 1 Samuel, 2 Samuel, 1 Reyes, 2 Reyes, 1 Crónicas, 2 Crónicas, Esdras, Nehemías, Ester, Job, Salmos, Proverbios, Eclesiastés, Cantares, Isaías, Jeremías, Lamentaciones, Ezequiel, Daniel, Oseas, Joel, Amós, Abdías, Jonás, Miqueas, Nahúm, Habacuc, Sofonías, Hageo, Zacarías, Malaquías"
BOOKS_NT = "Mateo, Marcos, Lucas, Juan, Hechos, Romanos, 1 Corintios, 2 Corintios, Gálatas, Efesios, Filipenses, Colosenses, 1 Tesalonicenses, 2 Tesalonicenses, 1 Timoteo, 2 Timoteo, Tito, Filemón, Hebreos, Santiago, 1 Pedro, 2 Pedro, 1 Juan, 2 Juan, 3 Juan, Judas, Apocalipsis"


def build_confesion(path):
    pdf = pdfplumber.open(path)
    doc = {"id": "confesion", "title": "Confesión de fe de Westminster y Catecismo Menor", "parts": []}
    prologue = {"title": "Prólogo", "chapters": [{"title": "Prólogo de esta edición", "blocks": []}]}
    conf = {"title": "Confesión de fe de Westminster", "chapters": []}
    cat = {"title": "Catecismo Menor de Westminster", "chapters": []}
    doc["parts"] = [prologue, conf, cat]
    chap = prologue["chapters"][0]
    para, para_bottom, kind = [], None, None
    in_catechism = False
    q_num = 0
    skip_booklist = False

    def flush():
        nonlocal para, kind
        if para and chap is not None:
            if kind == "refs":
                # each numbered proof line stays its own line
                items, cur = [], ""
                for l in para:
                    if re.match(r"^\d+\.\s", l) and cur:
                        items.append(cur); cur = l
                    else:
                        cur = (cur + " " + l) if cur else l
                if cur:
                    items.append(cur)
                chap["blocks"].append(["refs", "\n".join(plain(tidy(i)) for i in items)])
            else:
                s = join_lines(para)
                if kind == "q":
                    chap["blocks"].append(["h", plain(s)])
                else:
                    chap["blocks"].append(["p", s])
        para, kind = [], None

    for pn, page in enumerate(pdf.pages):
        if pn in (0, 1, 3, 4):
            continue
        lines = page.extract_text_lines(return_chars=True)
        for l in lines:
            c0 = l["chars"][0]
            size = round(c0["size"], 1)
            raw = l["text"].strip()
            if l["top"] > 785 and raw.isdigit():
                continue
            if pn == 2 and raw in ("Prólogo",):
                continue
            if size >= 15.5:
                m = re.match(r"Capítulo (\d+)", raw)
                if m:
                    flush()
                    n = int(m.group(1))
                    chap = {"title": f"Capítulo {n} · {CFW_TITLES[n - 1]}", "blocks": []}
                    conf["chapters"].append(chap)
                    skip_booklist = False
                elif raw.upper().startswith("DEL ESPIRITU SANTO") and conf["chapters"] and conf["chapters"][-1]["title"].startswith("Capítulo 33"):
                    flush()
                    chap = {"title": f"Capítulo 34 · {CFW_TITLES[33]}", "blocks": []}
                    conf["chapters"].append(chap)
                continue  # chapter caption lines (caps) are replaced by the title above
            if size >= 13 or size >= 30:
                continue
            if "Catecismo Menor" in raw and size > 10.5:
                continue
            italic = sum("Italic" in ch["fontname"] for ch in l["chars"]) / len(l["chars"]) > 0.6
            bold = sum("Bold" in ch["fontname"] for ch in l["chars"]) / len(l["chars"]) > 0.6
            m = re.match(r"Pregunta (\d+):", raw)
            if m and bold:
                flush()
                q_num = int(m.group(1))
                in_catechism = True
                for a, b, title in CATECHISM_GROUPS:
                    if q_num == a:
                        chap = {"title": f"Preguntas {a}–{b} · {title}", "blocks": []}
                        cat["chapters"].append(chap)
                kind = "q"
                para = [raw]
                para_bottom = l["bottom"]
                continue
            # CFW 1.2: the book list is laid out in columns; replace it with clean lists.
            if chap is not None and chap["title"].startswith("Capítulo 1 ") and raw.startswith("Antiguo Testamento"):
                flush()
                chap["blocks"].append(["h", "Antiguo Testamento"])
                chap["blocks"].append(["p", BOOKS_OT + "."])
                chap["blocks"].append(["h", "Nuevo Testamento"])
                chap["blocks"].append(["p", BOOKS_NT + "."])
                skip_booklist = True
                continue
            if skip_booklist:
                if raw.startswith("Todos estos fueron"):
                    skip_booklist = False
                else:
                    continue
            this = "refs" if (size < 9 and italic) or (size < 9) else ("q" if bold and in_catechism and kind == "q" else "p")
            s = styled_text(l["chars"], 10 if this != "refs" else 8, skip_small=False) if this != "refs" else raw
            gap = (l["top"] - para_bottom) if para_bottom is not None else 99
            starts_para = bool(re.match(r"^([IVX]+\.|\d+\.)\s", raw)) and this == "p"
            if this != kind or gap > 9 or gap < -50 or starts_para:
                if not (kind == "q" and this == "q" and 0 <= gap <= 9):
                    flush()
                    kind = this
            para.append(s)
            para_bottom = l["bottom"]
        para_bottom = None
    flush()
    # Drop the edition's own page headings from the prologue; keep its text.
    return doc


def polish(d):
    for p in d["parts"]:
        for c in p["chapters"]:
            out = []
            for b in c["blocks"]:
                if b[0] == "row" and len(b[1]) == 1:
                    b = ["h", plain(b[1][0])]
                if b[0] == "q" and out and out[-1][0] == "q" and len(b[1]) < 90 and len(out[-1][1].split("\n")[-1]) < 90:
                    out[-1] = ["q", out[-1][1] + "\n" + b[1]]
                    continue
                out.append(b)
            c["blocks"] = out


def main():
    guia, conf, orden, out = sys.argv[1:5]
    for name, d in (("guia", build_guia(guia)), ("confesion", build_confesion(conf)), ("orden", build_orden(orden))):
        polish(d)
        for p in d["parts"]:
            p["chapters"] = [c for c in p["chapters"] if c["blocks"]]
            for c in p["chapters"]:
                c["id"] = slug(p["title"])[:20] + "--" + slug(c["title"])
        d["parts"] = [p for p in d["parts"] if p["chapters"]]
        with open(f"{out}/{name}.json", "w") as f:
            json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
        n = sum(len(p["chapters"]) for p in d["parts"])
        b = sum(len(c["blocks"]) for p in d["parts"] for c in p["chapters"])
        print(name, len(d["parts"]), "parts", n, "chapters", b, "blocks")


if __name__ == "__main__":
    main()

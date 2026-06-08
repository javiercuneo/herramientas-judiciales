document.addEventListener('DOMContentLoaded', () => {
    // ---- Navigation Logic ----
    const navButtons = document.querySelectorAll('#nav button');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.view;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(v => {
                v.classList.remove('active-view');
                if(v.id === `view-${target}`) {
                    v.classList.add('active-view');
                }
            });
        });
    });

    // ---- Helper: Download Blob ----
    const downloadBlob = (bytes, filename, type) => {
        const blob = new Blob([bytes], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ========== PDF to Markdown Engine ==========

    function readOptions() {
        return {
            removeHash: document.getElementById('opt-hash').checked,
            removeFooters: document.getElementById('opt-footers').checked,
            removeHeaders: document.getElementById('opt-footers').checked,
            cleanBorders: document.getElementById('opt-borders').checked,
            repairSplitWords: document.getElementById('opt-split').checked,
            detectColumns: document.getElementById('opt-columns').checked,
            detectStructure: document.getElementById('opt-structure').checked,
            anonymize: document.getElementById('opt-anonymize').checked
        };
    }

    async function extractPages(pdf) {
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pages.push({
                num: i,
                items: textContent.items,
                width: page.view[2],
                height: page.view[3]
            });
        }
        return pages;
    }

    function groupLines(items, yTol) {
        yTol = yTol || 5;
        const sorted = [...items].sort((a, b) => {
            const yd = b.transform[5] - a.transform[5];
            return Math.abs(yd) > yTol ? yd : a.transform[4] - b.transform[4];
        });
        const lines = [];
        let cur = [];
        for (const item of sorted) {
            const y = item.transform[5];
            if (cur.length === 0) { cur = [item]; cur._y = y; }
            else if (Math.abs(y - cur._y) <= yTol) { cur.push(item); }
            else { lines.push(cur); cur = [item]; cur._y = y; }
        }
        if (cur.length) lines.push(cur);
        return lines;
    }

    function lineText(items) {
        let out = '';
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (i > 0) {
                const prev = items[i - 1];
                const gap = item.transform[4] - (prev.transform[4] + prev.width);
                const cw = prev.width / Math.max(prev.str.length, 1);
                if (gap > cw * 0.4) out += ' ';
            }
            out += item.str;
        }
        return out;
    }

    function jaccardSimilarity(a, b) {
        const sa = a.toLowerCase().trim();
        const sb = b.toLowerCase().trim();
        if (sa.length < 50 && sb.length < 50) {
            const setA = new Set(sa), setB = new Set(sb);
            let inter = 0;
            for (const ch of setA) if (setB.has(ch)) inter++;
            const union = new Set([...setA, ...setB]).size;
            return union === 0 ? 0 : inter / union;
        }
        const setA = new Set(sa.split(/\s+/)), setB = new Set(sb.split(/\s+/));
        let inter = 0;
        for (const w of setA) if (setB.has(w)) inter++;
        const union = new Set([...setA, ...setB]).size;
        return union === 0 ? 0 : inter / union;
    }

    function splitIntoColumns(items, pageWidth) {
        if (!pageWidth) return [items];
        const xPositions = items.map(item => Math.round(item.transform[4] / 5) * 5);
        const uniqX = [...new Set(xPositions)].sort((a, b) => a - b);
        if (uniqX.length < 4) return [items];
        const gaps = [];
        for (let i = 1; i < uniqX.length; i++) {
            const gap = uniqX[i] - uniqX[i - 1];
            if (gap > pageWidth * 0.12 && gap > 30) gaps.push(uniqX[i]);
        }
        if (gaps.length === 0) return [items];
        const columns = [];
        for (const item of items) {
            const x = item.transform[4];
            let colIdx = 0;
            for (let g = 0; g < gaps.length; g++) {
                if (x >= gaps[g]) colIdx = g + 1;
            }
            if (!columns[colIdx]) columns[colIdx] = [];
            columns[colIdx].push(item);
        }
        const result = columns.filter(c => c && c.length >= 3);
        return result.length > 1 ? result : [items];
    }

    function detectRepeated(pages) {
        const footerFreq = {}, headerFreq = {};
        for (const page of pages) {
            const lines = groupLines(page.items);
            const last = lines.slice(-6).map(l => lineText(l).trim()).filter(s => s.length > 15);
            const first = lines.slice(0, 4).map(l => lineText(l).trim()).filter(s => s.length > 10);
            for (const s of last) footerFreq[s] = (footerFreq[s] || 0) + 1;
            for (const s of first) headerFreq[s] = (headerFreq[s] || 0) + 1;
        }
        const th = pages.length * 0.4;
        const repeated = {
            footers: new Set(Object.keys(footerFreq).filter(k => footerFreq[k] >= th)),
            headers: new Set(Object.keys(headerFreq).filter(k => headerFreq[k] >= th * 0.7))
        };
        // Expand with similar variants (e.g. "Pág. 1/10" ←→ "Pág. 2/10")
        const SIM = 0.6;
        for (const text of Object.keys(footerFreq)) {
            if (repeated.footers.has(text)) continue;
            for (const known of repeated.footers) {
                if (jaccardSimilarity(text, known) >= SIM) { repeated.footers.add(text); break; }
            }
        }
        for (const text of Object.keys(headerFreq)) {
            if (repeated.headers.has(text)) continue;
            for (const known of repeated.headers) {
                if (jaccardSimilarity(text, known) >= SIM) { repeated.headers.add(text); break; }
            }
        }
        return repeated;
    }

    function isRepeated(text, set) {
        const t = text.trim();
        for (const r of set) {
            if (t.includes(r) || r.includes(t)) return true;
        }
        return false;
    }

    function isHashItem(str) {
        const t = str.trim();
        return t.startsWith('#') && /^#[\d#]+$/.test(t) && (t.match(/#/g) || []).length >= 3;
    }

    function isPageEdgeArtifact(text, lineIdx, totalLines) {
        const t = text.trim();
        if (!t) return false;
        // Only check first 2 and last 3 lines of each page
        const isEdge = lineIdx < 2 || lineIdx >= totalLines - 3;
        if (!isEdge) return false;
        // Pure digits → page number
        if (/^\d{1,4}$/.test(t)) return true;
        // Number range → page number
        if (/^\d{1,4}\s*[-–—/]\s*\d{1,4}$/.test(t)) return true;
        // "Page/Page./Pág./N° 5" at edges
        if (/^(Page|Pág|Pag|N°|Nro|Folio)\s*\d+/i.test(t)) return true;
        // Separator lines
        if (/^[-–—=_*·•]{5,}$/.test(t)) return true;
        return false;
    }

    function convertPDF(pages, opts) {
        const repeated = (opts.removeFooters || opts.removeHeaders) ? detectRepeated(pages) : { footers: new Set(), headers: new Set() };

        let md = '', firstPage = true;

        for (const page of pages) {
            // Split into column groups if enabled
            const colGroups = (opts.detectColumns && page.width)
                ? splitIntoColumns(page.items, page.width)
                : [page.items];

            let columnTexts = [];

            for (const colItems of colGroups) {
                const lines = groupLines(colItems);

                // Filter and process each line
                let outLines = [];

                for (let li = 0; li < lines.length; li++) {
                    let line = lines[li];

                    // Filter out hash items at item level (not whole lines)
                    if (opts.removeHash) {
                        const filtered = line.filter(item => !isHashItem(item.str));
                        if (filtered.length === 0) continue;
                        line = filtered;
                    }

                    const raw = lineText(line);
                    const trimmed = raw.trim();

                    if (!trimmed) continue;

                    // Remove repeated footers/headers
                    if (opts.removeFooters && isRepeated(trimmed, repeated.footers)) continue;
                    if (opts.removeHeaders && isRepeated(trimmed, repeated.headers)) continue;

                    // Remove page edge artifacts (page numbers, separators, stamps)
                    if (opts.cleanBorders && isPageEdgeArtifact(trimmed, li, lines.length)) continue;

                    // Handle cross-line split words (same x-position, lowercase continuation)
                    if (opts.repairSplitWords && outLines.length > 0) {
                        const prevInfo = outLines[outLines.length - 1];
                        const prevLastItem = prevInfo.items[prevInfo.items.length - 1];
                        const currFirstItem = line[0];
                        if (prevLastItem && currFirstItem) {
                            const lc = prevLastItem.str.trim().slice(-1);
                            const fc = currFirstItem.str.trim()[0];
                            if (/[a-záéíóúüñ]/.test(lc) && /[a-záéíóúüñ]/.test(fc) &&
                                Math.abs(prevLastItem.transform[4] - currFirstItem.transform[4]) < 25) {
                                // Merge with previous line (no newline)
                                outLines[outLines.length - 1] = {
                                    text: prevInfo.text + raw,
                                    items: [...prevInfo.items, ...line]
                                };
                                continue;
                            }
                        }
                    }

                    outLines.push({ text: raw, items: line });
                }

                if (outLines.length > 0) {
                    columnTexts.push(outLines.map(l => l.text.trimEnd()).join('\n'));
                }
            }

            if (columnTexts.length === 0) continue;

            // Build page text — join columns in reading order
            let pageText = columnTexts.join('\n\n');

            // Structure detection
            if (opts.detectStructure) {
                const paragraphs = pageText.split('\n');
                pageText = paragraphs.map(p => {
                    const t = p.trim();
                    if (t.length < 2 || t.length > 120) return p;
                    // ALL CAPS short lines → heading
                    const letters = t.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '');
                    if (letters.length >= 3 && letters === letters.toUpperCase() &&
                        letters.replace(/[A-ZÁÉÍÓÚÜÑ]/g, '').length / letters.length < 0.3) {
                        return '## ' + t;
                    }
                    // Roman numerals + dash at start → bold (I.- II.- III.- etc.)
                    p = p.replace(/^\s*([IVXLCDM]+\.-)\s*/, '**$1** ');
                    // a) b) c) at start of line → bold
                    p = p.replace(/^\s*([a-z]\))\s+/, '**$1** ');
                    return p;
                }).join('\n');
            }

            if (firstPage) firstPage = false;
            else md += '\n\n';
            md += pageText;
        }

        // Final cleanup
        md = md.replace(/\n{4,}/g, '\n\n\n').trim();
        return md;
    }

    function anonymize(text) {
        let r = text;
        // Firmas — línea completa
        r = r.replace(/^.*Firmado por:.*$/gm, '_[Firma]_');
        // DNI: 30.119.078
        r = r.replace(/\b\d{1,2}\.\d{3}\.\d{3}\b/g, '[DNI]');
        // CUIT/CUIL: 20-30119078-9
        r = r.replace(/\b\d{2}-\d{7,8}-\d\b/g, '[CUIT]');
        // Email
        r = r.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email]');
        // Teléfono internacional: +54 11 5555-1234
        r = r.replace(/\+54\s*\d{2,3}[\s-]*\d{3,4}[\s-]*\d{4}\b/g, '[Teléfono]');
        // Móvil argentino: 15-XXXX-XXXX
        r = r.replace(/\b15[\s-]\d{4}[\s-]\d{4}\b/g, '[Teléfono]');
        // Patente: ABC 123
        r = r.replace(/\b[A-Z]{3}\s?\d{3}\b/g, '[Patente]');
        // Expediente: Expte. n.° 56.868/2017
        r = r.replace(/Expte\.?\s*n\.?\s*°?\s*\d{1,5}\s*\.\s*\d{1,5}\/\s*\d{2,4}/gi, '[Expediente]');
        // Nombres tras títulos: Dr. Juan Pérez, Dra. María López, etc.
        r = r.replace(/(Dr|Dra|Sr|Sra|Srta|Juez|Jueza|Lic|Ing|Procurador|Defensor)\.?\s+([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+)+)/g, '$1 [Nombre]');
        // Nombres tras c/ (partes del juicio)
        r = r.replace(/([cC]\/)\s*([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+)+)/g, '$1 [Nombre]');
        return r;
    }

    // ---- Tool 1: PDF to Markdown ----
    const mdFile = document.getElementById('md-file');
    const mdBtn = document.getElementById('md-btn');
    const mdOutput = document.getElementById('md-output');
    const mdDownloadBtn = document.getElementById('md-download-btn');
    let mdContent = '';

    mdFile.addEventListener('change', () => {
        mdBtn.disabled = !mdFile.files.length;
    });

    mdBtn.addEventListener('click', async () => {
        const file = mdFile.files[0];
        if (!file) return;

        mdBtn.innerText = "Procesando...";
        mdBtn.disabled = true;
        mdOutput.innerText = "";
        mdOutput.style.display = "block";
        mdDownloadBtn.classList.add('hidden');
        mdContent = '';

        try {
            const opts = readOptions();
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            const pages = await extractPages(pdf);

            mdContent = `# ${file.name}\n\n` + convertPDF(pages, opts);

            if (opts.anonymize) {
                mdContent = anonymize(mdContent);
            }

            mdOutput.innerText = mdContent;
            mdDownloadBtn.classList.remove('hidden');
            mdBtn.innerText = "Extraer y Convertir";
            mdBtn.disabled = false;
        } catch (e) {
            console.error(e);
            mdOutput.innerText = "Error procesando el archivo PDF.";
            mdBtn.innerText = "Reintentar";
            mdBtn.disabled = false;
        }
    });

    mdDownloadBtn.addEventListener('click', () => {
        downloadBlob(new TextEncoder().encode(mdContent), 'documento.md', 'text/markdown');
    });

    // ---- Tool 2: Merge PDFs ----
    const mergeFiles = document.getElementById('merge-files');
    const mergeBtn = document.getElementById('merge-btn');
    const mergeList = document.getElementById('merge-list');
    let currentMergeFiles = [];

    mergeFiles.addEventListener('change', (e) => {
        currentMergeFiles = Array.from(e.target.files);
        mergeList.innerHTML = '';
        currentMergeFiles.forEach((f, i) => {
            const li = document.createElement('li');
            li.innerText = `${i + 1}. ${f.name}`;
            mergeList.appendChild(li);
        });
        mergeBtn.disabled = currentMergeFiles.length < 2;
    });

    mergeBtn.addEventListener('click', async () => {
        mergeBtn.innerText = "Uniendo...";
        mergeBtn.disabled = true;

        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            for (const file of currentMergeFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedBytes = await mergedPdf.save();
            downloadBlob(mergedBytes, 'DOCUMENTOS_UNIDOS.pdf', 'application/pdf');
        } catch(e) {
            console.error(e);
            alert("Ocurrió un error al unir los PDFs.");
        }

        mergeBtn.innerText = "Unir PDFs";
        mergeBtn.disabled = false;
    });

    // ---- Tool 3: Split PDF ----
    const splitFile = document.getElementById('split-file');
    const splitRange = document.getElementById('split-range');
    const splitBtn = document.getElementById('split-btn');

    splitFile.addEventListener('change', () => validateSplit());
    splitRange.addEventListener('input', () => validateSplit());

    function validateSplit() {
        splitBtn.disabled = !(splitFile.files.length && splitRange.value.trim() !== "");
    }

    splitBtn.addEventListener('click', async () => {
        const file = splitFile.files[0];
        const rangeStr = splitRange.value.trim();
        if (!file || !rangeStr) return;

        splitBtn.innerText = "Separando...";
        splitBtn.disabled = true;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = sourcePdf.getPageCount();
            
            let pagesToExtract = new Set();
            const parts = rangeStr.split(',');
            
            for (const part of parts) {
                const cleanedPart = part.trim();
                if (cleanedPart.includes('-')) {
                    const [start, end] = cleanedPart.split('-').map(Number);
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = start; i <= end; i++) {
                            if (i > 0 && i <= totalPages) pagesToExtract.add(i - 1);
                        }
                    }
                } else {
                    const p = Number(cleanedPart);
                    if (!isNaN(p) && p > 0 && p <= totalPages) {
                        pagesToExtract.add(p - 1);
                    }
                }
            }

            const indices = Array.from(pagesToExtract).sort((a,b) => a-b);
            
            if (indices.length === 0) {
                alert("Rango inválido o fuera del límite de páginas de este documento.");
                throw new Error("Invalid range");
            }

            const newPdf = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdf.copyPages(sourcePdf, indices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const newBytes = await newPdf.save();
            downloadBlob(newBytes, `SEPARADO_${file.name}`, 'application/pdf');

        } catch (e) {
            console.error(e);
            if (e.message !== "Invalid range") {
                alert("Ocurrió un error al separar el PDF.");
            }
        }

        splitBtn.innerText = "Separar y Descargar";
        splitBtn.disabled = false;
    });

    // ---- Tool 4: Rotate Pages ----
    const rotateFile = document.getElementById('rotate-file');
    const rotateDegrees = document.getElementById('rotate-degrees');
    const rotateBtn = document.getElementById('rotate-btn');

    rotateFile.addEventListener('change', () => {
        rotateBtn.disabled = !rotateFile.files.length;
    });

    rotateBtn.addEventListener('click', async () => {
        const file = rotateFile.files[0];
        if (!file) return;

        rotateBtn.innerText = "Rotando...";
        rotateBtn.disabled = true;

        try {
            const degrees = parseInt(rotateDegrees.value, 10);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            
            const pages = pdf.getPages();
            pages.forEach(page => {
                const currentAngle = page.getRotation().angle;
                page.setRotation(PDFLib.degrees(currentAngle + degrees));
            });

            const newBytes = await pdf.save();
            downloadBlob(newBytes, `ROTADO_${file.name}`, 'application/pdf');

        } catch(e) {
            console.error(e);
            alert("Ocurrió un error al rotar las páginas del PDF.");
        }

        rotateBtn.innerText = "Rotar y Descargar";
        rotateBtn.disabled = false;
    });

    // Handle offline status
    window.addEventListener('offline', () => {
        console.log("App is currently offline.");
    });
});

const sampleResume = {
  name: "name",
  role: "前端开发工程师",
  contact: "上海 | 138-0000-0000 | chen@example.com",
  summary:
    "3 年前端开发经验，擅长 React、TypeScript 与复杂业务表单。关注产品体验、性能优化和工程化协作，能独立推进从需求拆解到上线复盘的完整流程。",
  links: [
    { label: "GitHub", url: "https://github.com/example" },
  ],
  sections: [
    {
      title: "工作经历",
      body:
        "星河科技 · 前端开发工程师 | 2023.04 - 至今\n- 负责低代码表单搭建平台核心编辑器，支持 30+ 业务线配置化交付。\n- 优化首屏资源加载与路由拆包，主要页面 LCP 从 3.2s 降至 1.8s。\n- 建立组件验收清单与 Storybook 文档，减少跨团队接入沟通成本。",
    },
    {
      title: "项目经历",
      body:
        "智能简历优化工具\n- 设计简历结构化编辑模型，支持实时预览、模板切换与 PDF 导出。\n- 接入岗位描述匹配逻辑，输出关键词缺口和简历改写建议。",
    },
    {
      title: "教育经历",
      body: "东华大学 · 软件工程 本科 | 2018.09 - 2022.06",
    },
  ],
};

const storageKey = "resume-link-studio-data";
const maxLinks = 3;
const pdfLibraries = [
  {
    src: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    isReady: () => Boolean(window.html2canvas),
  },
  {
    src: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
    isReady: () => Boolean(window.jspdf?.jsPDF),
  },
];
let resume = loadResume();
let currentTemplate = "classic";

const fields = {
  name: document.querySelector("#nameInput"),
  role: document.querySelector("#roleInput"),
  contact: document.querySelector("#contactInput"),
  summary: document.querySelector("#summaryInput"),
};

const linkList = document.querySelector("#linkList");
const sectionList = document.querySelector("#sectionList");
const preview = document.querySelector("#resumePreview");
const previewFocusBtn = document.querySelector("#previewFocusBtn");
const addLinkBtn = document.querySelector("#addLinkBtn");
const importFileInput = document.querySelector("#importFileInput");
const printButtons = document.querySelectorAll("#printBtn, #printBtnTop");

function loadResume() {
  try {
    const saved = localStorage.getItem(storageKey);
    return normalizeResume(saved ? JSON.parse(saved) : sampleResume);
  } catch {
    return cloneResume(sampleResume);
  }
}

function saveResume() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(resume));
  } catch {
    // Preview should keep working even when browser storage is unavailable.
  }
}

function cloneResume(data) {
  return JSON.parse(JSON.stringify(data));
}

function toText(value) {
  return String(value ?? "");
}

function normalizeResume(data) {
  const source = data && typeof data === "object" ? data : {};
  const fallback = cloneResume(sampleResume);

  return {
    name: toText(source.name ?? fallback.name),
    role: toText(source.role ?? fallback.role),
    contact: toText(source.contact ?? fallback.contact),
    summary: toText(source.summary ?? fallback.summary),
    links: Array.isArray(source.links) ? source.links.map(normalizeLink) : fallback.links,
    sections: Array.isArray(source.sections) ? source.sections.map(normalizeSection) : fallback.sections,
  };
}

function normalizeLink(link) {
  const source = link && typeof link === "object" ? link : {};
  return {
    label: toText(source.label),
    url: toText(source.url),
  };
}

function normalizeSection(section) {
  const source = section && typeof section === "object" ? section : {};
  return {
    title: toText(source.title),
    body: toText(source.body),
  };
}

function normalizeUrl(url) {
  const trimmed = toText(url).trim();
  if (!trimmed || /^https?:\/\/$/i.test(trimmed)) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^file:/i.test(trimmed)) return trimmed;
  if (/^[a-z]:[\\/]/i.test(trimmed)) return `file:///${encodeURI(trimmed.replaceAll("\\", "/"))}`;
  if (/^(#|\.{1,2}\/|\/)/.test(trimmed)) return trimmed;
  if (/\.(html?|pdf|png|jpe?g|gif|webp|svg|mp4|zip|docx?|xlsx?)($|[?#])/i.test(trimmed)) {
    return trimmed.replaceAll("\\", "/");
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return "";
  return `https://${trimmed}`;
}

function toAbsoluteLink(href) {
  if (!href || /^(mailto:|tel:|https?:|file:)/i.test(href)) return href;
  try {
    return new URL(href, window.location.href).href;
  } catch {
    return href;
  }
}

function formatDisplayUrl(url) {
  return toText(url).trim();
}

function openPreviewLink(link) {
  const href = link.getAttribute("href");
  const target = toAbsoluteLink(href);

  if (!target) return;
  window.open(target, "_blank", "noopener,noreferrer");
}

function escapeHtml(value) {
  return toText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEditor() {
  fields.name.value = toText(resume.name);
  fields.role.value = toText(resume.role);
  fields.contact.value = toText(resume.contact);
  fields.summary.value = toText(resume.summary);
  addLinkBtn.disabled = resume.links.length >= maxLinks;
  addLinkBtn.textContent = addLinkBtn.disabled ? "最多 3 个" : "添加链接";

  linkList.innerHTML = resume.links
    .map(
      (link, index) => `
        <div class="editable-item">
          <label>显示文字<input type="text" value="${escapeHtml(link.label)}" data-link-field="label" data-index="${index}" /></label>
          <label>超链接<input type="text" value="${escapeHtml(link.url)}" placeholder="GitHub：https://github.com/example" data-link-field="url" data-index="${index}" /></label>
          <div class="item-actions">
            <button class="small-button" data-link-move="${index}" data-direction="-1" ${index === 0 ? "disabled" : ""}>上移</button>
            <button class="small-button" data-link-move="${index}" data-direction="1" ${index === resume.links.length - 1 ? "disabled" : ""}>下移</button>
            <button class="small-button delete" data-link-delete="${index}">删除</button>
          </div>
        </div>
      `,
    )
    .join("");

  sectionList.innerHTML = resume.sections
    .map(
      (section, index) => `
        <div class="editable-item">
          <label>模块标题<input type="text" value="${escapeHtml(section.title)}" data-section-field="title" data-index="${index}" /></label>
          <label>内容<textarea rows="6" data-section-field="body" data-index="${index}">${escapeHtml(section.body)}</textarea></label>
          <div class="item-actions">
            <button class="small-button" data-section-move="${index}" data-direction="-1" ${index === 0 ? "disabled" : ""}>上移</button>
            <button class="small-button" data-section-move="${index}" data-direction="1" ${index === resume.sections.length - 1 ? "disabled" : ""}>下移</button>
            <button class="small-button delete" data-section-delete="${index}">删除</button>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderPreview() {
  preview.className = `resume-page template-${currentTemplate}`;
  const links = resume.links
    .map((link) => ({
      label: toText(link.label).trim(),
      href: toAbsoluteLink(normalizeUrl(link.url)),
      displayUrl: formatDisplayUrl(link.url),
    }))
    .filter((link) => link.label && link.href)
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}：${escapeHtml(link.displayUrl)}</a>`,
    )
    .join("");

  const sections = resume.sections
    .map(normalizeSection)
    .filter((section) => section.title.trim() || section.body.trim())
    .map(
      (section) => `
        <section class="resume-section">
          <h3>${escapeHtml(section.title)}</h3>
          <div class="section-body">${escapeHtml(section.body)}</div>
        </section>
      `,
    )
    .join("");

  preview.innerHTML = `
    <header class="resume-header">
      <h2 class="resume-name">${escapeHtml(resume.name)}</h2>
      <div class="resume-role">${escapeHtml(resume.role)}</div>
      <div class="resume-contact">${escapeHtml(resume.contact)}</div>
      <p class="resume-summary">${escapeHtml(resume.summary)}</p>
      <nav class="link-grid" aria-label="作品链接">${links}</nav>
    </header>
    <div class="resume-content">${sections}</div>
  `;
}

function updateAll() {
  resume = normalizeResume(resume);
  renderEditor();
  renderPreview();
  saveResume();
}

function moveItem(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

function focusPreview() {
  preview.scrollIntoView({ behavior: "smooth", block: "start" });
  preview.focus({ preventScroll: true });
}

function getActionButton(event, selector) {
  const button = event.target.closest(selector);
  return button && !button.disabled ? button : null;
}

function loadScript(library) {
  return new Promise((resolve, reject) => {
    if (library.isReady()) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(`script[src="${library.src}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = library.src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensurePdfLibraries() {
  await Promise.all(pdfLibraries.map(loadScript));
}

function getPdfFileName() {
  const name = toText(resume.name).trim() || "resume";
  return `${name.replace(/[\\/:*?"<>|]/g, "_")}-简历.pdf`;
}

function getPreviewLinks() {
  const previewRect = preview.getBoundingClientRect();
  const pdfScale = 595.28 / previewRect.width;

  return Array.from(preview.querySelectorAll(".link-grid a[href]")).map((link) => {
    const rect = link.getBoundingClientRect();
    return {
      url: toAbsoluteLink(link.getAttribute("href")),
      x: (rect.left - previewRect.left) * pdfScale,
      y: (rect.top - previewRect.top) * pdfScale,
      width: rect.width * pdfScale,
      height: rect.height * pdfScale,
    };
  });
}

function addLinkAnnotations(pdf, links, pageTop, pageHeight) {
  links.forEach((link) => {
    const linkTop = link.y;
    const linkBottom = link.y + link.height;
    const visibleTop = Math.max(linkTop, pageTop);
    const visibleBottom = Math.min(linkBottom, pageTop + pageHeight);

    if (visibleBottom <= visibleTop) return;
    pdf.link(link.x, visibleTop - pageTop, link.width, visibleBottom - visibleTop, { url: link.url });
  });
}

async function exportPdf() {
  printButtons.forEach((button) => {
    button.disabled = true;
  });

  try {
    await ensurePdfLibraries();
    await document.fonts?.ready;

    const canvas = await window.html2canvas(preview, {
      backgroundColor: "#ffffff",
      scale: Math.max(2, window.devicePixelRatio || 1),
      useCORS: true,
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const sourcePageHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
    const pageCanvas = document.createElement("canvas");
    const pageContext = pageCanvas.getContext("2d");
    const links = getPreviewLinks();
    let sourceTop = 0;
    let pageIndex = 0;

    pageCanvas.width = canvas.width;

    while (sourceTop < canvas.height) {
      const sourceHeight = Math.min(sourcePageHeight, canvas.height - sourceTop);
      const exportedPageHeight = (sourceHeight * pageWidth) / canvas.width;

      pageCanvas.height = sourceHeight;
      pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(canvas, 0, sourceTop, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, exportedPageHeight);
      addLinkAnnotations(pdf, links, pageIndex * pageHeight, exportedPageHeight);

      sourceTop += sourceHeight;
      pageIndex += 1;
    }

    pdf.save(getPdfFileName());
  } catch {
    alert("可点击 PDF 导出组件加载失败，将改用浏览器打印。若需要保留超链接，请保持联网后重试。");
    window.print();
  } finally {
    printButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

Object.entries(fields).forEach(([key, field]) => {
  field.addEventListener("input", () => {
    resume[key] = field.value;
    resume = normalizeResume(resume);
    saveResume();
    renderPreview();
  });
});

linkList.addEventListener("input", (event) => {
  const field = event.target.dataset.linkField;
  if (!field) return;
  resume.links[Number(event.target.dataset.index)][field] = event.target.value;
  resume = normalizeResume(resume);
  saveResume();
  renderPreview();
});

linkList.addEventListener("click", (event) => {
  const actionButton = getActionButton(event, "[data-link-delete], [data-link-move]");
  if (!actionButton) return;

  const deleteIndex = actionButton.dataset.linkDelete;
  const moveIndex = actionButton.dataset.linkMove;
  if (deleteIndex !== undefined) resume.links.splice(Number(deleteIndex), 1);
  if (moveIndex !== undefined) moveItem(resume.links, Number(moveIndex), Number(actionButton.dataset.direction));
  if (deleteIndex !== undefined || moveIndex !== undefined) updateAll();
});

preview.addEventListener("click", (event) => {
  const link = event.target.closest(".link-grid a");
  if (!link) return;

  event.preventDefault();
  openPreviewLink(link);
});

preview.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const link = event.target.closest(".link-grid a");
  if (!link) return;

  event.preventDefault();
  openPreviewLink(link);
});

sectionList.addEventListener("input", (event) => {
  const field = event.target.dataset.sectionField;
  if (!field) return;
  resume.sections[Number(event.target.dataset.index)][field] = event.target.value;
  resume = normalizeResume(resume);
  saveResume();
  renderPreview();
});

sectionList.addEventListener("click", (event) => {
  const actionButton = getActionButton(event, "[data-section-delete], [data-section-move]");
  if (!actionButton) return;

  const deleteIndex = actionButton.dataset.sectionDelete;
  const moveIndex = actionButton.dataset.sectionMove;
  if (deleteIndex !== undefined) resume.sections.splice(Number(deleteIndex), 1);
  if (moveIndex !== undefined) moveItem(resume.sections, Number(moveIndex), Number(actionButton.dataset.direction));
  if (deleteIndex !== undefined || moveIndex !== undefined) updateAll();
});

previewFocusBtn.addEventListener("click", focusPreview);

document.querySelector("#addLinkBtn").addEventListener("click", () => {
  if (resume.links.length >= maxLinks) return;
  resume.links.push({ label: "GitHub", url: "https://github.com/example" });
  updateAll();
});

document.querySelector("#addSectionBtn").addEventListener("click", () => {
  resume.sections.push({ title: "新模块", body: "" });
  updateAll();
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  resume = cloneResume(sampleResume);
  updateAll();
});

document.querySelector("#exportDataBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "resume-data.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector("#importDataBtn").addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    resume = normalizeResume({
      name: imported.name || "",
      role: imported.role || "",
      contact: imported.contact || "",
      summary: imported.summary || "",
      links: Array.isArray(imported.links) ? imported.links : [],
      sections: Array.isArray(imported.sections) ? imported.sections : [],
    });
    updateAll();
  } catch {
    alert("导入失败，请选择正确的 JSON 简历数据。");
  } finally {
    importFileInput.value = "";
  }
});

document.querySelectorAll("[data-template]").forEach((button) => {
  button.addEventListener("click", () => {
    currentTemplate = button.dataset.template;
    document.querySelectorAll("[data-template]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderPreview();
  });
});

printButtons.forEach((button) => {
  button.addEventListener("click", exportPdf);
});

updateAll();

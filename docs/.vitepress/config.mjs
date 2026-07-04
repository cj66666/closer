// VitePress 配置:Closer 文档站
// base 可配:独立部署用 "/";GitHub Pages 用 "/chengjiaoguan/docs/";嵌入产品站子路径用 "/docs/"。
// 分类只在此表达,不移动现有 docs/*.md 文件;赛事/审计类文档通过 srcExclude 排除出公开站点。
import { defineConfig } from "vitepress";

const base = process.env.DOCS_BASE || "/";

export default defineConfig({
  base,
  lang: "zh-CN",
  title: "Closer 文档",
  description: "跨境 B2B AI 询盘成交工作台 —— 开发文档、使用手册与 API 参考",
  cleanUrls: true,
  // 现有文档含大量指向仓库源码/同级文件的相对链接,非站点页面,关闭死链校验避免误报。
  ignoreDeadLinks: true,
  // 内部/赛事/审计文档保留在仓库,但不发布到公开站点。
  srcExclude: [
    "WAVE2_SUBMISSION.md",
    "WAVE3_SUBMISSION.md",
    "COMPETITION_SUBMISSION.md",
    "CROSS_REVIEW_ACTION_PLAN.md",
    "EXECUTION_PLAN.md",
    "IMPLEMENTATION_AUDIT.md",
    "COMPLETION_AUDIT.md",
    "VISUAL_QA.md",
    "PUBLIC_REVIEW_CHECKLIST.md",
  ],
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/getting-started" },
      { text: "使用手册", link: "/manual/overview" },
      { text: "API", link: "/api/" },
      { text: "运维", link: "/DEMO_RUNBOOK" },
      { text: "产品", link: "/PRODUCT_OVERVIEW" },
    ],
    sidebar: [
      {
        text: "指南",
        collapsed: false,
        items: [
          { text: "快速开始", link: "/guide/getting-started" },
          { text: "架构概览", link: "/guide/architecture" },
          { text: "开发手册", link: "/guide/development" },
          { text: "环境变量配置", link: "/ENVIRONMENT" },
        ],
      },
      {
        text: "使用手册",
        collapsed: false,
        items: [
          { text: "概述", link: "/manual/overview" },
          { text: "工作台操作", link: "/manual/workbench" },
          { text: "数据维护与 ROI", link: "/DATA_OPERATIONS" },
        ],
      },
      {
        text: "API",
        collapsed: false,
        items: [
          { text: "导读(鉴权 / 分页 / 错误)", link: "/api/" },
          { text: "完整参考(OpenAPI)", link: "/api/reference" },
        ],
      },
      {
        text: "运维",
        collapsed: false,
        items: [
          { text: "演示手册", link: "/DEMO_RUNBOOK" },
          { text: "生产手册", link: "/PRODUCTION_RUNBOOK" },
        ],
      },
      {
        text: "产品",
        collapsed: false,
        items: [
          { text: "产品概述", link: "/PRODUCT_OVERVIEW" },
          { text: "系统规格", link: "/SPECS" },
          { text: "端到端证据", link: "/END_TO_END_EVIDENCE" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/cj66666/chengjiaoguan" }],
    search: { provider: "local" },
    outline: { label: "本页目录", level: [2, 3] },
    docFooter: { prev: "上一页", next: "下一页" },
    darkModeSwitchLabel: "外观",
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    lastUpdated: { text: "最后更新" },
  },
});

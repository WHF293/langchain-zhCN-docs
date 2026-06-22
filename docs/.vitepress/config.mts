import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LangChain 中文文档',
  description: 'LangChain、LangGraph、DeepAgents 中文文档',

  // 部署到 GitHub Pages 子目录，配置 base
  base: '/langchain-zhCN-docs/',

  // 主题配置
  themeConfig: {
    // 网站标题
    siteTitle: 'LangChain 中文文档',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: 'LangChain', link: '/langchain/' },
      { text: 'LangGraph', link: '/langgraph/' },
      { text: 'DeepAgents', link: '/deepagents/' },
      { text: '补充', link: '/other/' },
    ],

    // 侧边栏
    sidebar: {
      '/langchain/': [
        {
          text: '入门基础',
          items: [
            { text: '概述', link: '/langchain/01-概述' },
            { text: '快速入门', link: '/langchain/02-快速入门' },
            { text: '安装指南', link: '/langchain/03-安装指南' },
            { text: '设计哲学', link: '/langchain/04-设计哲学' },
            { text: '组件架构', link: '/langchain/05-组件架构' },
          ],
        },
        {
          text: '核心组件',
          items: [
            { text: '模型', link: '/langchain/06-模型' },
            { text: '消息', link: '/langchain/07-消息' },
            { text: '工具', link: '/langchain/08-工具' },
            { text: 'MCP集成', link: '/langchain/09-MCP集成' },
            { text: '结构化输出', link: '/langchain/10-结构化输出' },
          ],
        },
        {
          text: '输出与记忆',
          items: [
            { text: '流式输出', link: '/langchain/11-流式输出' },
            { text: '事件流', link: '/langchain/12-事件流' },
            { text: '短期记忆', link: '/langchain/13-短期记忆' },
            { text: '长期记忆', link: '/langchain/14-长期记忆' },
            { text: '上下文工程', link: '/langchain/15-上下文工程' },
          ],
        },
        {
          text: 'Agent 与运行时',
          items: [
            { text: '运行时', link: '/langchain/16-运行时' },
            { text: 'Agent代理', link: '/langchain/17-Agent代理' },
            { text: '人在回路', link: '/langchain/18-人在回路' },
            { text: '护栏', link: '/langchain/19-护栏' },
          ],
        },
        {
          text: 'RAG 与检索',
          items: [
            { text: 'RAG检索增强', link: '/langchain/20-RAG检索增强' },
            { text: '检索', link: '/langchain/21-检索' },
            { text: '知识库', link: '/langchain/22-知识库' },
            { text: 'SQL-Agent', link: '/langchain/23-SQL-Agent' },
            { text: '语音代理', link: '/langchain/24-语音代理' },
          ],
        },
        {
          text: '可观测性与中间件',
          items: [
            { text: '可观测性', link: '/langchain/25-可观测性' },
            { text: '中间件概述', link: '/langchain/26-中间件概述' },
            { text: '内置中间件', link: '/langchain/27-内置中间件' },
            { text: '自定义中间件', link: '/langchain/28-自定义中间件' },
          ],
        },
      ],
      '/langgraph/': [
        {
          text: '入门基础',
          items: [
            { text: '概述', link: '/langgraph/01-概述' },
            { text: '快速入门', link: '/langgraph/02-快速入门' },
            { text: '安装指南', link: '/langgraph/03-安装指南' },
          ],
        },
        {
          text: 'API 核心',
          items: [
            { text: 'Graph-API概述', link: '/langgraph/04-Graph-API概述' },
            { text: 'Functional-API概述', link: '/langgraph/05-Functional-API概述' },
            { text: 'Graph-API使用', link: '/langgraph/06-Graph-API使用' },
            { text: 'Functional-API使用', link: '/langgraph/07-Functional-API使用' },
            { text: '子图使用', link: '/langgraph/08-子图使用' },
            { text: 'API选择指南', link: '/langgraph/20-API选择指南' },
          ],
        },
        {
          text: '状态与调试',
          items: [
            { text: '时间旅行调试', link: '/langgraph/09-时间旅行调试' },
            { text: '中断与人在回路', link: '/langgraph/10-中断与人在回路' },
            { text: '检查点', link: '/langgraph/13-检查点' },
            { text: '存储', link: '/langgraph/14-存储' },
            { text: '添加记忆', link: '/langgraph/15-添加记忆' },
          ],
        },
        {
          text: '输出与流式',
          items: [
            { text: '流式输出', link: '/langgraph/11-流式输出' },
            { text: '事件流', link: '/langgraph/12-事件流' },
          ],
        },
        {
          text: '应用场景',
          items: [
            { text: 'Agentic-RAG', link: '/langgraph/16-Agentic-RAG' },
            { text: 'SQL-Agent', link: '/langgraph/17-SQL-Agent' },
            { text: '工作流与Agent', link: '/langgraph/18-工作流与Agent' },
            { text: 'LangGraph思维', link: '/langgraph/19-LangGraph思维' },
          ],
        },
      ],
      '/deepagents/': [
        {
          text: '入门基础',
          items: [
            { text: '概述', link: '/deepagents/01-概述' },
            { text: '快速入门', link: '/deepagents/02-快速入门' },
            { text: '对比分析', link: '/deepagents/03-对比分析' },
          ],
        },
        {
          text: '核心配置',
          items: [
            { text: '模型配置', link: '/deepagents/04-模型配置' },
            { text: '工具', link: '/deepagents/05-工具' },
            { text: '技能', link: '/deepagents/06-技能' },
            { text: '记忆', link: '/deepagents/07-记忆' },
            { text: '子代理', link: '/deepagents/08-子代理' },
          ],
        },
        {
          text: '输出与控制',
          items: [
            { text: '流式输出', link: '/deepagents/09-流式输出' },
            { text: '事件流', link: '/deepagents/10-事件流' },
            { text: '人在回路', link: '/deepagents/11-人在回路' },
            { text: '权限', link: '/deepagents/12-权限' },
          ],
        },
        {
          text: '基础设施',
          items: [
            { text: '后端', link: '/deepagents/13-后端' },
            { text: '沙箱', link: '/deepagents/14-沙箱' },
            { text: '解释器', link: '/deepagents/15-解释器' },
            { text: '配置文件', link: '/deepagents/16-配置文件' },
            { text: '自定义', link: '/deepagents/17-自定义' },
          ],
        },
        {
          text: '高级功能',
          items: [
            { text: '上下文工程', link: '/deepagents/18-上下文工程' },
            { text: '生产部署', link: '/deepagents/19-生产部署' },
            { text: '评分标准', link: '/deepagents/20-评分标准' },
            { text: '异步子代理', link: '/deepagents/21-异步子代理' },
            { text: '编程式子代理', link: '/deepagents/22-编程式子代理' },
          ],
        },
        {
          text: 'Code 系列',
          items: [
            { text: 'Code概述', link: '/deepagents/23-Code概述' },
            { text: 'Code配置', link: '/deepagents/24-Code配置' },
            { text: 'Code提供者', link: '/deepagents/25-Code提供者' },
            { text: 'Code-MCP工具', link: '/deepagents/26-Code-MCP工具' },
            { text: 'Code记忆与技能', link: '/deepagents/27-Code记忆与技能' },
            { text: 'Code数据位置', link: '/deepagents/28-Code数据位置' },
            { text: 'Code远程沙箱', link: '/deepagents/29-Code远程沙箱' },
            { text: 'Code子代理', link: '/deepagents/30-Code子代理' },
          ],
        },
      ],
      '/other/': [
        { text: 'langchain 三剑客的关系', link: '/other/relation/' },
        { text: 'deepagents 对比其他 agent', link: '/other/deepagents 对比 claude' },
      ],
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/langchain-ai' },
    ],

    // 搜索配置
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    // 页脚
    footer: {
      message: '基于 LangChain 官方文档翻译',
      copyright: '© 2026 LangChain 中文文档',
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
    },

    // 文档页脚导航
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    // 大纲标题
    outlineTitle: '页面导航',
    outline: [2, 3],

    // 返回顶部
    returnToTopLabel: '回到顶部',

    // 菜单
    sidebarMenuLabel: '菜单',

    // 深色模式切换
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到深色模式',
    lightModeSwitchTitle: '切换到浅色模式',
  },

  // Markdown 配置
  markdown: {
    lineNumbers: true,
  },

  // 最后更新时间
  lastUpdated: true,

  // 清除 URL
  cleanUrls: true,
})

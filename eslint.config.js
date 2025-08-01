export default [
  {
    ignores: [
      "*.md",
      "src/content/**/*.md", 
      "node_modules/",
      "dist/",
      ".astro/",
      "package-lock.json"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // 根据需要添加全局变量
      }
    },
    rules: {
      // 你的ESLint规则
    }
  }
];

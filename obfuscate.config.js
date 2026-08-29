module.exports = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayEncoding: [], // تعطيل base64 لأنه يسبب خطأ charAt في بيئة المتصفح
  stringArrayIndexShift: false,
  stringArrayWrappersCount: 1,
  stringArrayWrappersType: "variable",
  stringArrayThreshold: 0.5,
  transformObjectKeys: false, // ممنوع تشفير مفاتيح الكائنات لأنها تكسر React 19 و Next.js
  unicodeEscapeSequence: false,
};

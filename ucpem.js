/// <reference path="./.vscode/config.d.ts" />
const { project, github } = require("ucpem")
// @ts-check

const eventUtil = github("bt7s7k7/EventLib")

const src = project.prefix("src")
src.res("entitySystem",
    eventUtil.res("eventLib")
)


project.prefix("test").use(github("bt7s7k7/TestUtil").res("testUtil"))
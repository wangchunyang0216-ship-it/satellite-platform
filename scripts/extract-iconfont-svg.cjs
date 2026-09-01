const fs = require("fs")
const path = require("path")

const source = path.resolve(__dirname, "../icon/iconfont.js")
const outputDir = path.resolve(__dirname, "../src/assets/icons/svg")
const iconfont = fs.readFileSync(source, "utf8")
const symbolPattern = /<symbol id="icon-([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g

let match
let count = 0

while ((match = symbolPattern.exec(iconfont))) {
  const [, name, viewBox, body] = match
  const normalizedBody = body
    .replace(/\sfill="#[0-9A-Fa-f]{3,8}"/g, "")
    .replace(/\sfill="currentColor"/g, "")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${normalizedBody}</svg>\n`

  fs.writeFileSync(path.join(outputDir, `${name}.svg`), svg, "utf8")
  count += 1
}

console.log(`generated ${count} svg icons`)

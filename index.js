const dotEnv = require("dotenv")
const fs = require("fs")
const path = require("path")
const inquirer = require("inquirer")

dotEnv.config()

path.resolve = path.resolve.bind(null, process.cwd())

const envPath = path.resolve("./.env")
const envTemplatePath = path.resolve("./.env.template")
const isCI = Object.keys(process.env).some(it => it.startsWith("CI"))

;(async () => {
  const currentEnvFile = readTextFile(envPath)
  const envTemplate = dotEnv.parse(readTextFile(envTemplatePath))
  const currentEnv = dotEnv.parse(currentEnvFile)
  const missingEnvVariables = Object.keys(envTemplate)
    .filter(it => !process.env[it])
    .map(key => ({ key, value: envTemplate[key] }))

  if (missingEnvVariables.some(it => !it.value) && !isCI) {
    console.log("\nOops! Some environment variables are missing...\n")
  }

  for (const { key, value } of missingEnvVariables) {
    if (value) {
      currentEnv[key] = value
    } else if (isCI) {
      console.error(`\n\nError: The environment variable ${key} is missing\n\n`)
      process.exit(1)
    } else {
      const { newValue } = await inquirer.prompt([
        {
          type: "input",
          name: "newValue",
          message: `What should be the value of ${key}?`,
          validate: Boolean
        }
      ])

      currentEnv[key] = newValue
    }
  }

  fs.writeFileSync(
    envPath,
    Object.entries(currentEnv)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n"),
    { encoding: "utf8" }
  )
})()

function readTextFile(path) {
  return fs.existsSync(path) ? fs.readFileSync(path).toString() : ""
}

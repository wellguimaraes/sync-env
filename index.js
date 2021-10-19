#!/usr/bin/env node

const dotEnv = require("dotenv")
const fs = require("fs")
const path = require("path")
const inquirer = require("inquirer")
const isCI = require("is-ci")

dotEnv.config()

const resolve = (it) => path.resolve(process.cwd(), it)

const envPath = resolve(".env")

module.exports = (async () => {
  const currentEnvFile = readTextFile(envPath)
  const envTemplate = dotEnv.parse(
    readTextFile(resolve(".env.template")) ||
      readTextFile(resolve(".env.example"))
  )

  const currentEnv = dotEnv.parse(currentEnvFile)
  const missingEnvVariables = Object.keys(envTemplate)
    .filter((it) => !process.env[it])
    .map((key) => ({ key, value: envTemplate[key] }))

  const missingEnvVariablesWithoutDefaultValue = missingEnvVariables.filter(
    (it) => !it.value
  )

  if (missingEnvVariablesWithoutDefaultValue.length) {
    if (isCI) {
      console.error(`\n\n❌  Error: The following env variables are missing:`)
      missingEnvVariablesWithoutDefaultValue.forEach((it) =>
        console.error(` - ${it.key}`)
      )
      console.error("\n\n")
      process.exit(1)
    } else {
      console.log("\n❌  Oops! Some environment variables are missing...\n")
    }
  }

  for (const { key, value } of missingEnvVariables) {
    if (value) {
      currentEnv[key] = value
    } else {
      const { newValue } = await inquirer.prompt([
        {
          type: "input",
          name: "newValue",
          message: `What should be the value of ${key}?`,
          validate: Boolean,
        },
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
